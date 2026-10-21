// services/cleanup-session.job.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { GameSession } from '../entities/game-session.entity';

@Injectable()
export class CleanupSessionJob {
  private readonly logger = new Logger(CleanupSessionJob.name);

  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const idleTimeoutSeconds = parseInt(
      process.env.SESSION_IDLE_TIMEOUT_SECONDS ?? '1800',
      10,
    );
    const threshold = new Date(Date.now() - idleTimeoutSeconds * 1000);
    const result = await this.sessionRepo.update(
      {
        lastHeartbeatAt: LessThan(threshold),
        status: 'IN_PROGRESS',
      },
      {
        status: 'ABANDONED',
        closeReason: 'IDLE_TIMEOUT',
      },
    );
    this.logger.log(`Cleaned up ${result.affected} idle sessions`);
  }
}
