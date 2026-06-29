import { Injectable, Logger } from '@nestjs/common';

export interface MetricSnapshot {
  key: string;
  value: number;
  recordedAt: Date;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly counters = new Map<string, number>();
  private readonly history: MetricSnapshot[] = [];

  increment(key: string, by = 1): void {
    const current = this.counters.get(key) ?? 0;
    this.counters.set(key, current + by);
    this.history.push({ key, value: current + by, recordedAt: new Date() });
    this.logger.debug(`[metric] ${key} = ${current + by}`);
  }

  get(key: string): number {
    return this.counters.get(key) ?? 0;
  }

  snapshot(): Record<string, number> {
    return Object.fromEntries(this.counters.entries());
  }

  history_for(key: string): MetricSnapshot[] {
    return this.history.filter((s) => s.key === key);
  }

  reset(key: string): void {
    this.counters.delete(key);
  }
}
