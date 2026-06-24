// src/modules/season/season.service.ts
import { Season } from './season.entity';
export class SeasonService {
  private seasons: Season[] = [];

  createSeason(dto: Partial<Season>) {
    const season: Season = {
      id: crypto.randomUUID(),
      name: dto.name!,
      startDate: dto.startDate!,
      endDate: dto.endDate!,
      isActive: true,
      bonusXpMultiplier: dto.bonusXpMultiplier ?? 1,
    };

    this.seasons.push(season);
    return season;
  }

  endExpiredSeasons() {
    const now = new Date();

    this.seasons.forEach((s) => {
      if (s.endDate < now) {
        s.isActive = false;
      }
    });
  }

  getActiveSeason() {
    return this.seasons.find((s) => s.isActive);
  }
}