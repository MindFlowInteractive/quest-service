/**
 * Compute funnel conversion rates between sequential puzzle analytics
 * events (e.g. started -> attempted -> completed). (#415)
 */
export interface FunnelStep {
  name: string;
  count: number;
}

export interface FunnelConversion {
  from: string;
  to: string;
  conversionRate: number;
}

export function computeFunnelConversions(steps: FunnelStep[]): FunnelConversion[] {
  const conversions: FunnelConversion[] = [];

  for (let i = 1; i < steps.length; i++) {
    const previous = steps[i - 1];
    const current = steps[i];
    conversions.push({
      from: previous.name,
      to: current.name,
      conversionRate: previous.count === 0 ? 0 : current.count / previous.count,
    });
  }

  return conversions;
}

export function overallDropOff(steps: FunnelStep[]): number {
  if (steps.length === 0 || steps[0].count === 0) return 0;
  const first = steps[0].count;
  const last = steps[steps.length - 1].count;
  return 1 - last / first;
}
