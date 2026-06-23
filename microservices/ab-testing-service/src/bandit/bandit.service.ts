import { Injectable } from '@nestjs/common';
import { Variant } from '../entities/variant.entity';
import { Result } from '../entities/result.entity';

/**
 * Simple ε‑greedy multi‑armed bandit implementation.
 * For each variant we track successes (metric > 0) and attempts.
 * With probability ε we explore a random variant, otherwise we exploit the best.
 */
@Injectable()
export class BanditService {
  private readonly epsilon = 0.1; // exploration rate

  // In‑memory statistics – in production you would persist these.
  private stats: Record<string, { successes: number; attempts: number }> = {};

  recordResult(variantId: string, metric?: number) {
    if (!this.stats[variantId]) this.stats[variantId] = { successes: 0, attempts: 0 };
    this.stats[variantId].attempts += 1;
    if (metric && metric > 0) this.stats[variantId].successes += 1;
  }

  chooseVariant(variants: Variant[]): Variant {
    if (Math.random() < this.epsilon) {
      // Explore random variant
      return variants[Math.floor(Math.random() * variants.length)];
    }
    // Exploit: pick variant with highest success rate
    let best = variants[0];
    let bestRate = this.successRate(best.id);
    for (const v of variants) {
      const rate = this.successRate(v.id);
      if (rate > bestRate) {
        best = v;
        bestRate = rate;
      }
    }
    return best;
  }

  private successRate(variantId: string): number {
    const s = this.stats[variantId];
    if (!s || s.attempts === 0) return 0;
    return s.successes / s.attempts;
  }
}
