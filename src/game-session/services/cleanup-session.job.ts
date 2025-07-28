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

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    const threshold = new Date(Date.now() - 1000 * 60 * 30); // 30 mins
    const result = await this.sessionRepo.update(
      {
        lastActiveAt: LessThan(threshold),
        status: 'IN_PROGRESS',
      },
      {
        status: 'ABANDONED',
      },
    );
    this.logger.log(`Cleaned up ${result.affected} idle sessions`);
  }
}
