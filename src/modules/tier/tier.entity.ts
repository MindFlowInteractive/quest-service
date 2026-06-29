// src/modules/tier/tier.entity.ts
export class Tier {
  id: string;
  seasonId: string;

  level: number;

  freeReward: string;
  premiumReward: string;

  xpRequired: number;
}