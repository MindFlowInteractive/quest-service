// src/modules/season/season.entity.ts
export class Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;

  bonusXpMultiplier: number; // seasonal events
}