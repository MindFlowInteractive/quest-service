import { Injectable, NotFoundException } from '@nestjs/common';

export interface SeasonalEvent {
  id: string; name: string; season: string;
  startDate: string; endDate: string; active: boolean;
}

@Injectable()
export class SeasonalEventService {
  private readonly events: SeasonalEvent[] = [];

  create(name: string, season: string, startDate: string, endDate: string): SeasonalEvent {
    const e: SeasonalEvent = { id: Date.now().toString(), name, season, startDate, endDate, active: false };
    this.events.push(e);
    return e;
  }

  findAll(): SeasonalEvent[] { return [...this.events]; }

  findActive(): SeasonalEvent[] {
    const now = new Date().toISOString();
    return this.events.filter((e) => e.startDate <= now && e.endDate >= now);
  }

  activate(id: string): SeasonalEvent {
    const e = this.events.find((x) => x.id === id);
    if (!e) throw new NotFoundException(`Event ${id} not found`);
    e.active = true;
    return e;
  }
}
