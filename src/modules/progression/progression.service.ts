// src/modules/progression/progression.service.ts
import { Season } from '../season/season.entity';
export class ProgressionService {
  addXp(pass, xp: number, season: Season) {
    const totalXp = xp * season.bonusXpMultiplier;

    pass.currentXp += totalXp;

    return this.calculateLevel(pass);
  }

  calculateLevel(pass) {
    const newLevel = Math.floor(pass.currentXp / 1000);
    pass.level = newLevel;

    return pass;
  }
}