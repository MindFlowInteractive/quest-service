import { Injectable } from '@nestjs/common';
import { Result } from '../entities/result.entity';
import { Variant } from '../entities/variant.entity';

@Injectable()
export class AnalysisService {
  // Simple conversion rate calculation per variant
  async calculateConversionRates(results: Result[], variants: Variant[]) {
    const counts: Record<string, { total: number; conversions: number }> = {};
    for (const v of variants) {
      counts[v.id] = { total: 0, conversions: 0 };
    }
    for (const r of results) {
      const entry = counts[r.variantId];
      if (entry) {
        entry.total += 1;
        if (r.metric && r.metric > 0) entry.conversions += 1;
      }
    }
    const rates = variants.map(v => {
      const { total, conversions } = counts[v.id];
      return { variantId: v.id, conversionRate: total ? conversions / total : 0 };
    });
    return rates;
  }

  // Placeholder significance test (Chi‑squared) – returns boolean for significance
  async significanceTest(_rates: any[]): Promise<boolean> {
    // In a real implementation, compute chi‑squared statistic.
    return true; // assume significant for now
  }

  async determineWinner(rates: any[]): Promise<string | null> {
    if (rates.length === 0) return null;
    const best = rates.reduce((prev, curr) => (curr.conversionRate > prev.conversionRate ? curr : prev));
    return best.variantId;
  }
}
