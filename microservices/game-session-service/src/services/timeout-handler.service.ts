import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionService } from './session.service';
import { ReplayService } from './replay.service';

@Injectable()
export class TimeoutHandlerService {
  private readonly logger = new Logger(TimeoutHandlerService.name);
  private readonly INACTIVE_THRESHOLD_SECONDS = 1800; // 30 minutes

  constructor(
    private readonly sessionService: SessionService,
    private readonly replayService: ReplayService,
  ) {}

  /**
   * Check for expired sessions every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredSessions() {
    this.logger.debug('Checking for expired sessions...');

    try {
      const expiredSessions = await this.sessionService.getExpiredSessions();

      for (const session of expiredSessions) {
        this.logger.log(`Handling expired session: ${session.sessionId}`);

        // Stop recording if active
        try {
          const replay = await this.replayService.getReplayBySessionId(
            session.sessionId,
          );
          if (replay.isRecording) {
            await this.replayService.stopRecording(session.sessionId);
          }
        } catch (error) {
          // Replay might not exist, which is fine
          this.logger.debug(
            `No replay found for expired session: ${session.sessionId}`,
          );
        }

        // Timeout the session
        await this.sessionService.timeout(session.sessionId);
      }

      if (expiredSessions.length > 0) {
        this.logger.log(
          `Handled ${expiredSessions.length} expired session(s)`,
        );
      }
    } catch (error) {
      this.logger.error('Error handling expired sessions', error);
    }
  }

  /**
   * Check for inactive sessions every 5 minutes
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async handleInactiveSessions() {
    this.logger.debug('Checking for inactive sessions...');

    try {
      const inactiveSessions =
        await this.sessionService.getInactiveSessions(
          this.INACTIVE_THRESHOLD_SECONDS,
        );

      for (const session of inactiveSessions) {
        this.logger.log(
          `Handling inactive session: ${session.sessionId} (last active: ${session.lastActiveAt})`,
        );

        // Pause inactive sessions instead of timing them out immediately
        if (session.status === 'ACTIVE') {
          await this.sessionService.pause(session.sessionId);
        }
      }

      if (inactiveSessions.length > 0) {
        this.logger.log(
          `Handled ${inactiveSessions.length} inactive session(s)`,
        );
      }
    } catch (error) {
      this.logger.error('Error handling inactive sessions', error);
    }
  }
}
