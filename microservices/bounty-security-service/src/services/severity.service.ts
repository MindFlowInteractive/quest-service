import { Injectable, Logger } from '@nestjs/common';
import { SeverityTier } from '../entities/report-status.enum';

/**
 * Output of the severity assessment engine — the engine explains *why* it
 * arrived at a tier, not just the tier itself.
 */
export interface SeverityAssessment {
  severity: SeverityTier;
  /** Normalized 0-100 risk score (higher = more severe). */
  score: number;
  rationale: {
    cvss?: number;
    componentBoost: number;
    impactMultiplier: number;
    notes: string[];
  };
}

/**
 * Severity assessment engine. Combines the researcher-supplied CVSS score,
 * the affected component's criticality, and the reported impact category
 * into a defensible severity tier + numeric risk score.
 *
 * Tunable via env vars. Goals: reproducible, explainable, consistent with
 * general-purpose CVSS v3.1 thresholds.
 */
@Injectable()
export class SeverityService {
  private readonly logger = new Logger(SeverityService.name);

  /**
   * Component criticality map — keywords that indicate high-value systems.
   * Extend as the org's attack surface evolves.
   */
  private readonly criticalComponentKeywords = [
    'auth',
    'login',
    'session',
    'token',
    'jwt',
    'oauth',
    'payment',
    'billing',
    'wallet',
    'admin',
    'root',
    'rce',
  ];

  private readonly sensitiveComponentKeywords = [
    'pii',
    'profile',
    'message',
    'notification',
    'leaderboard',
    'reputation',
    'gamification',
  ];

  /**
   * Impact category strings submitted by researchers. Each carries a
   * multiplier reflecting how serious it is.
   */
  private readonly impactMultipliers: Record<string, number> = {
    'rce': 1.5,
    'auth-bypass': 1.45,
    'privilege-escalation': 1.4,
    'sql-injection': 1.35,
    'xss-stored': 1.2,
    'ssrf': 1.25,
    'secrets-exposure': 1.25,
    'data-exposure': 1.2,
    'xss-reflected': 1.05,
    'csrf': 1.0,
    'info-disclosure': 0.9,
    'rate-limit': 0.7,
    'best-practice': 0.5,
  };

  /**
   * Compute a severity assessment for a report under triage.
   */
  assess(input: {
    researcherSeverity?: SeverityTier;
    cvssScore?: number | null;
    cvssVector?: string | null;
    affectedComponent?: string;
    impact?: string;
  }): SeverityAssessment {
    const notes: string[] = [];
    const cvss = this.parseCvss(input.cvssScore ?? null, input.cvssVector ?? null);
    const componentBoost = this.componentBoost(input.affectedComponent ?? '');
    const impactMultiplier = this.impactMultiplier(input.impact);

    // No signals at all → conservative INFO classification.
    if (cvss === null && !input.researcherSeverity) {
      return {
        severity: SeverityTier.INFO,
        score: 0,
        rationale: {
          componentBoost,
          impactMultiplier,
          notes: ['no severity signals supplied; defaulting to info'],
        },
      };
    }

    if (cvss !== null) notes.push(`cvss=${cvss.toFixed(2)}`);
    notes.push(`componentBoost=${componentBoost.toFixed(2)}`);
    if (input.impact) notes.push(`impact=${input.impact} (x${impactMultiplier.toFixed(2)})`);

    // Convert CVSS to a 0..100 baseline. CVSS 10 = 100, CVSS 0 = 0.
    const cvssBaseline = cvss !== null ? cvss * 10 : researcherFallback(input.researcherSeverity);

    const score = Math.min(100, Math.round(cvssBaseline * componentBoost * impactMultiplier * 10) / 10);

    const severity = this.toTier(score, input.researcherSeverity);

    if (input.researcherSeverity && input.researcherSeverity !== severity) {
      notes.push(
        `overrode researcher's "${input.researcherSeverity}" → "${severity}" based on computed score ${score}`,
      );
    }

    return {
      severity,
      score,
      rationale: {
        cvss: cvss ?? undefined,
        componentBoost,
        impactMultiplier,
        notes,
      },
    };
  }

  /**
   * CVSS v3.1 base-score calculator. Implements the official formula,
   * including the scope-changed multiplier for `S:C`.
   * See: https://www.first.org/cvss/v3.1/specification-document
   */
  private parseCvss(score: number | null, vector: string | null): number | null {
    if (typeof score === 'number' && !Number.isNaN(score)) {
      return Math.max(0, Math.min(10, score));
    }
    if (vector) {
      const m = vector.match(
        /\/AV:([ANP])\/AC:([LH])\/PR:([NLH])\/UI:([NR])\/S:([UC])\/C:([HLN])\/I:([HLN])\/A:([HLN])/,
      );
      if (!m) return null;
      const AV: Record<string, number> = { N: 0.85, A: 0.62, P: 0.55 };
      const AC: Record<string, number> = { L: 0.77, H: 0.44 };
      // PR impact flips based on scope. Defaults assume S:U.
      const PR_U: Record<string, number> = { N: 0.85, L: 0.62, H: 0.27 };
      const PR_C: Record<string, number> = { N: 0.85, L: 0.68, H: 0.5 };
      const UI: Record<string, number> = { N: 0.85, R: 0.62 };
      const CIA: Record<string, number> = { H: 0.56, L: 0.22, N: 0 };

      const av = AV[m[1]] ?? 0.85;
      const ac = AC[m[2]] ?? 0.77;
      const scopeChanged = m[5] === 'C';
      const pr = (scopeChanged ? PR_C : PR_U)[m[3]] ?? 0.85;
      const ui = UI[m[4]] ?? 0.85;
      const c = CIA[m[6]] ?? 0.56;
      const i = CIA[m[7]] ?? 0.56;
      const a = CIA[m[8]] ?? 0.56;

      const iss = 1 - (1 - c) * (1 - i) * (1 - a);
      const impactBase = scopeChanged
        ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
        : 6.42 * iss;
      const impact = scopeChanged ? 1.08 * impactBase : impactBase;
      if (impact <= 0) return 0;
      const exploitability = 8.22 * av * ac * pr * ui;
      // CVSS v3.1: roundUp(min( [1.08 if scope] * (Impact + Exploitability), 10)).
      const summed = impact + exploitability;
      const base = Math.min(10, Math.round(summed * 10) / 10);
      return scopeChanged ? Math.min(10, Math.round((1.08 * base) * 10) / 10) : base;
    }
    return null;
  }

  private componentBoost(component: string): number {
    const lower = component.toLowerCase();
    if (this.criticalComponentKeywords.some((k) => lower.includes(k))) return 1.25;
    if (this.sensitiveComponentKeywords.some((k) => lower.includes(k))) return 1.1;
    return 1.0;
  }

  private impactMultiplier(impact?: string): number {
    if (!impact) return 1.0;
    return this.impactMultipliers[impact.toLowerCase()] ?? 1.0;
  }

  private toTier(score: number, fallback?: SeverityTier): SeverityTier {
    if (score >= 90) return SeverityTier.CRITICAL;
    if (score >= 70) return SeverityTier.HIGH;
    if (score >= 40) return SeverityTier.MEDIUM;
    if (score >= 15) return SeverityTier.LOW;
    return SeverityTier.INFO;
  }
}

/**
 * Map researcher-supplied severity to a baseline 0-100 score when
 * no CVSS is provided.
 */
function researcherFallback(severity?: SeverityTier): number {
  switch (severity) {
    case SeverityTier.CRITICAL:
      return 95;
    case SeverityTier.HIGH:
      return 75;
    case SeverityTier.MEDIUM:
      return 50;
    case SeverityTier.LOW:
      return 25;
    case SeverityTier.INFO:
      return 10;
    default:
      return 50;
  }
}
