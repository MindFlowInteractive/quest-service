// src/modules/pass/pass.entity.ts
export class BattlePass {
  id: string;
  userId: string;
  seasonId: string;

  isPremium: boolean;
  purchasedAt?: Date;

  level: number;
  currentXp: number;

  createdAt: Date;
}