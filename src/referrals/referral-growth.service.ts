import { Injectable, Logger } from '@nestjs/common';

export interface GrowthStats {
  totalReferrals: number;
  conversionRate: number;
  topReferrers: Array<{ userId: string; count: number }>;
}

@Injectable()
export class ReferralGrowthService {
  private readonly logger = new Logger(ReferralGrowthService.name);
  private readonly referralCounts = new Map<string, number>();
  private totalConverted = 0;
  private totalAttempted = 0;

  recordReferral(referrerId: string, converted: boolean): void {
    const count = (this.referralCounts.get(referrerId) ?? 0) + 1;
    this.referralCounts.set(referrerId, count);
    this.totalAttempted += 1;
    if (converted) {
      this.totalConverted += 1;
    }
    this.logger.log(`Referral recorded for ${referrerId} — converted: ${converted}`);
  }

  getStats(): GrowthStats {
    const topReferrers = [...this.referralCounts.entries()]
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalReferrals: this.totalAttempted,
      conversionRate: this.totalAttempted > 0
        ? this.totalConverted / this.totalAttempted
        : 0,
      topReferrers,
    };
  }

  getReferralCount(referrerId: string): number {
    return this.referralCounts.get(referrerId) ?? 0;
  }
}
