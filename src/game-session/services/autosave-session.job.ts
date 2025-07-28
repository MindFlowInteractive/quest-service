// services/autosave-session.job.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GameSessionService } from './game-session.service';

@Injectable()
export class AutosaveSessionJob {
  private readonly logger = new Logger(AutosaveSessionJob.name);

  constructor(private readonly sessionService: GameSessionService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const sessions = await this.sessionService.getActiveSessions();
    for (const session of sessions) {
      try {
        session.lastActiveAt = new Date();
        await this.sessionService.updateState(session.id, {});
        this.logger.log(`Autosaved session ${session.id}`);
      } catch (err) {
        this.logger.error(`Failed to autosave session ${session.id}`, err.stack);
      }
    }
  }
}
