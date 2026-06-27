import { SeverityService } from './severity.service';
import { SeverityTier } from '../entities/report-status.enum';

describe('SeverityService', () => {
  let service: SeverityService;

  beforeEach(() => {
    service = new SeverityService();
  });

  it('escalates high CVSS on auth components to CRITICAL', () => {
    const result = service.assess({
      cvssScore: 8.5,
      cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      affectedComponent: 'auth-service',
      impact: 'rce',
    });
    expect(result.severity).toBe(SeverityTier.CRITICAL);
    expect(result.rationale.cvss).toBe(8.5);
    expect(result.rationale.componentBoost).toBeGreaterThan(1);
    expect(result.rationale.impactMultiplier).toBe(1.5);
  });

  it('downgrades informational CVSS on non-sensitive components to LOW', () => {
    const result = service.assess({
      cvssScore: 4.0,
      affectedComponent: 'static-docs-page',
      impact: 'info-disclosure',
    });
    // score = 40 * 1.0 * 0.9 = 36 (LOW bucket)
    expect(result.severity).toBe(SeverityTier.LOW);
  });

  it('falls back to researcher-supplied severity when no CVSS is provided', () => {
    const a = service.assess({ researcherSeverity: SeverityTier.HIGH });
    expect(a.score).toBeGreaterThanOrEqual(70);
    expect(a.severity).toBe(SeverityTier.HIGH);

    const b = service.assess({ researcherSeverity: SeverityTier.INFO });
    expect(b.severity).toBe(SeverityTier.INFO);
  });

  it('parses a CVSS vector when no numeric score is provided', () => {
    const result = service.assess({
      cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
      affectedComponent: 'payments',
    });
    expect(result.rationale.cvss).toBeGreaterThan(0);
    expect(result.severity).toBe(SeverityTier.CRITICAL);
  });

  it('returns INFO when no signals are present', () => {
    const result = service.assess({});
    expect(result.severity).toBe(SeverityTier.INFO);
  });
});
