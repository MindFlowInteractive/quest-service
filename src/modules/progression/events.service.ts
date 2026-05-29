// src/modules/progression/events.service.ts
export class EventsService {
  applyBonusXp(baseXp: number, eventMultiplier: number) {
    return baseXp * eventMultiplier;
  }
}