// src/modules/rewards/reward.service.ts
export class RewardService {
  unlockRewards(pass: any, tiers: any[]) {
    return tiers.map((tier) => {
      const unlocked = pass.level >= tier.level;

      return {
        tier: tier.level,
        freeReward: unlocked ? tier.freeReward : null,
        premiumReward: pass.isPremium && unlocked ? tier.premiumReward : null,
      };
    });
  }
}