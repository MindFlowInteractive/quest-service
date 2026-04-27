import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Anomaly, AnomalyType } from '../entities/anomaly.entity';
import { PatternSummary } from './behavior-pattern.service';

// ── Risk weight table ───────────────────────────────────────────────────────
const ANOMALY_RISK_WEIGHTS: Record<AnomalyType, number> = {
  [AnomalyType.STATISTICAL_OUTLIER]: 15,
  [AnomalyType.VELOCITY_SPIKE]: 20,
  [AnomalyType.IMPOSSIBLE_VALUE]: 35,
  [AnomalyType.SUDDEN_SKILL_JUMP]: 25,
  [AnomalyType.REPETITIVE_SEQUENCE]: 30,
};

export interface RiskScore {
  playerId: string;
  score: number;            // 0–100
  level: 'low' | 'medium' | 'high' | 'critical';
  anomalies: Anomaly[];
  computedAt: Date;
}

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);

  // Z-score threshold for statistical outlier detection
  private readonly Z_SCORE_THRESHOLD = 3.0;
  // Velocity spike: pattern count vs mean exceeds this multiplier
  private readonly VELOCITY_SPIKE_FACTOR = 5.0;

  constructor(
    @InjectRepository(Anomaly)
    private readonly anomalyRepo: Repository<Anomaly>,
  ) {}

  // ── Anomaly detection algorithms ──────────────────────────────────────────

  /**
   * Z-score outlier detection.
   * Returns an anomaly record if |z| > threshold.
   */
  detectStatisticalOutlier(
    playerId: string,
    metric: string,
    observed: number,
    mean: number,
    stdDev: number,
  ): Anomaly | null {
    if (stdDev === 0) return null;

    const z = Math.abs((observed - mean) / stdDev);
    if (z < this.Z_SCORE_THRESHOLD) return null;

    const confidence = Math.min(1, (z - this.Z_SCORE_THRESHOLD) / this.Z_SCORE_THRESHOLD);

    return this.anomalyRepo.create({
      playerId,
      anomalyType: AnomalyType.STATISTICAL_OUTLIER,
      metric,
      observedValue: observed,
      expectedValue: mean,
      deviationScore: z,
      confidence,
      context: { mean, stdDev, zScore: z },
      detectedAt: new Date(),
    });
  }

  /**
   * Velocity spike: check if current rate exceeds historical mean by a large factor.
   */
  detectVelocitySpike(
    playerId: string,
    metric: string,
    currentRate: number,
    historicalMean: number,
  ): Anomaly | null {
    if (historicalMean === 0 || currentRate <= historicalMean) return null;

    const factor = currentRate / historicalMean;
    if (factor < this.VELOCITY_SPIKE_FACTOR) return null;

    const confidence = Math.min(1, (factor - this.VELOCITY_SPIKE_FACTOR) / this.VELOCITY_SPIKE_FACTOR);

    return this.anomalyRepo.create({
      playerId,
      anomalyType: AnomalyType.VELOCITY_SPIKE,
      metric,
      observedValue: currentRate,
      expectedValue: historicalMean,
      deviationScore: factor,
      confidence,
      context: { factor, historicalMean },
      detectedAt: new Date(),
    });
  }

  /**
   * Impossible value: check if a game metric is physically impossible
   * (e.g. score per second > theoretical max, negative time, etc.).
   */
  detectImpossibleValue(
    playerId: string,
    metric: string,
    observed: number,
    maxPossible: number,
  ): Anomaly | null {
    if (observed <= maxPossible) return null;

    const deviationScore = observed / maxPossible;
    return this.anomalyRepo.create({
      playerId,
      anomalyType: AnomalyType.IMPOSSIBLE_VALUE,
      metric,
      observedValue: observed,
      expectedValue: maxPossible,
      deviationScore,
      confidence: 1.0, // impossible values are certain anomalies
      context: { maxPossible, ratio: deviationScore },
      detectedAt: new Date(),
    });
  }

  /**
   * Sudden skill jump: detect if score/rating improved too quickly.
   * A legitimate player cannot improve by more than `maxGainPerHour` per hour.
   */
  detectSuddenSkillJump(
    playerId: string,
    previousRating: number,
    currentRating: number,
    elapsedHours: number,
    maxGainPerHour = 50,
  ): Anomaly | null {
    if (elapsedHours <= 0) return null;

    const gainPerHour = (currentRating - previousRating) / elapsedHours;
    if (gainPerHour <= maxGainPerHour) return null;

    const confidence = Math.min(1, (gainPerHour - maxGainPerHour) / maxGainPerHour);

    return this.anomalyRepo.create({
      playerId,
      anomalyType: AnomalyType.SUDDEN_SKILL_JUMP,
      metric: 'ratingGainPerHour',
      observedValue: gainPerHour,
      expectedValue: maxGainPerHour,
      deviationScore: gainPerHour / maxGainPerHour,
      confidence,
      context: { previousRating, currentRating, elapsedHours, gainPerHour },
      detectedAt: new Date(),
    });
  }

  /**
   * Analyse all patterns for a player and persist detected anomalies.
   */
  async analyzePatterns(
    playerId: string,
    patterns: PatternSummary[],
  ): Promise<Anomaly[]> {
    const detected: Anomaly[] = [];

    for (const pattern of patterns) {
      if (pattern.sampleCount < 3) continue;

      for (const [metric, value] of Object.entries(pattern.latestFeatures)) {
        // Statistical outlier
        const outlier = this.detectStatisticalOutlier(
          playerId,
          `${pattern.patternType}.${metric}`,
          value,
          pattern.mean,
          pattern.stdDev,
        );
        if (outlier) detected.push(outlier);

        // Velocity spike (compare current to mean)
        const spike = this.detectVelocitySpike(
          playerId,
          `${pattern.patternType}.${metric}`,
          value,
          pattern.mean,
        );
        if (spike) detected.push(spike);
      }
    }

    if (detected.length > 0) {
      await this.anomalyRepo.save(detected);
      this.logger.warn(`Detected ${detected.length} anomalies for player ${playerId}`);
    }

    return detected;
  }

  // ── Risk scoring ────────────────────────────────────────────────────────────

  /**
   * Compute a composite risk score (0–100) from recent anomalies.
   * Uses weighted sum capped at 100, recent anomalies weighted higher.
   */
  async computeRiskScore(
    playerId: string,
    windowMinutes = 60,
  ): Promise<RiskScore> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const anomalies = await this.anomalyRepo.find({
      where: { playerId, detectedAt: MoreThan(since) },
      order: { detectedAt: 'DESC' },
    });

    let score = 0;
    for (const anomaly of anomalies) {
      const weight = ANOMALY_RISK_WEIGHTS[anomaly.anomalyType] ?? 10;
      // Recency factor: anomalies in the last 15 min get 2× weight
      const ageMinutes = (Date.now() - anomaly.detectedAt.getTime()) / 60_000;
      const recencyMultiplier = ageMinutes < 15 ? 2 : 1;
      score += weight * Number(anomaly.confidence) * recencyMultiplier;
    }

    score = Math.min(100, Math.round(score));

    return {
      playerId,
      score,
      level: score >= 85 ? 'critical' : score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low',
      anomalies,
      computedAt: new Date(),
    };
  }

  async getRecentAnomalies(playerId: string, windowMinutes = 60): Promise<Anomaly[]> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    return this.anomalyRepo.find({
      where: { playerId, detectedAt: MoreThan(since) },
      order: { detectedAt: 'DESC' },
    });
  }
}
