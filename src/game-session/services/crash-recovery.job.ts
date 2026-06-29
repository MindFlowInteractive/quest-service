// services/crash-recovery.job.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { GameSession } from '../entities/game-session.entity';
import { NotificationService } from '../../notifications/notification.service';
import { PlayerEventsService } from '../../player-events/player-events.service';
import { CacheService } from '../../cache/services/cache.service';

@Injectable()
export class CrashRecoveryJob {
  private readonly logger = new Logger(CrashRecoveryJob.name);

  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
    private readonly notificationService: NotificationService,
    private readonly playerEventsService: PlayerEventsService,
    private readonly cacheService: CacheService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireSuspendedSessions() {
    const graceWindowSecs = parseInt(
      process.env.SESSION_GRACE_WINDOW_SECONDS ?? '300',
      10,
    );
    const cutoff = new Date(Date.now() - graceWindowSecs * 1000);

    const expired = await this.sessionRepo.find({
      where: { status: 'SUSPENDED', suspendedAt: LessThan(cutoff) },
    });

    if (!expired.length) return;

    this.logger.log(`Expiring ${expired.length} suspended session(s)`);

    for (const session of expired) {
      try {
        const timePlayed = session.duration;
        const hintsUsed = session.hintsUsed;
        const progressPercent =
          (session.state?.progressPercent as number) ?? 0;

        session.status = 'ABANDONED';
        session.lastActiveAt = new Date();
        await this.sessionRepo.save(session);

        await this.playerEventsService.emitPlayerEvent({
          userId: session.userId,
          sessionId: session.id,
          eventType: 'puzzle.abandoned',
          payload: {
            sessionId: session.id,
            reason: 'session expired after disconnect grace window',
            endedAt: session.lastActiveAt,
            timePlayed,
            hintsUsed,
            progressPercent,
          },
        });

        await this.notificationService.emitPushEvent(
          session.userId,
          'sessionExpired',
          {
            title: 'Session Expired',
            body: 'Your paused game session has expired. Start a new game to continue!',
            data: {
              sessionId: session.id,
              progressPercent,
              timePlayed,
              hintsUsed,
            },
          },
        );

        await this.cacheService.delete(`session:suspended:${session.id}`);

        this.logger.log(
          `Session ${session.id} expired — timePlayed=${timePlayed}m, hints=${hintsUsed}, progress=${progressPercent}%`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to expire session ${session.id}`,
          (err as Error).stack,
        );
      }
    }
  }
}
