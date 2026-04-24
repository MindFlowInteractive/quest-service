import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionService } from './session.service';
import { SessionStatus } from '../entities/session.entity';

@Injectable()
export class SessionTimeoutService {
  private readonly logger = new Logger(SessionTimeoutService.name);
  private readonly INACTIVE_THRESHOLD_SECONDS = 1800; // 30 minutes
  private readonly CLEANUP_INTERVAL_SECONDS = 300; // 5 minutes

  constructor(private readonly sessionService: SessionService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleSessionTimeouts(): Promise<void> {
    try {
      // Handle expired sessions (timeout based on timeoutAt field)
      const expiredSessions = await this.sessionService.getExpiredSessions();
      
      for (const session of expiredSessions) {
        await this.sessionService.timeout(session.sessionId);
        this.logger.warn(`Session timed out: ${session.sessionId} for user: ${session.userId}`);
      }

      // Handle inactive sessions (no recent activity)
      const inactiveSessions = await this.sessionService.getInactiveSessions(
        this.INACTIVE_THRESHOLD_SECONDS,
      );
      
      for (const session of inactiveSessions) {
        await this.sessionService.abandon(session.sessionId);
        this.logger.warn(`Session abandoned due to inactivity: ${session.sessionId} for user: ${session.userId}`);
      }

      if (expiredSessions.length > 0 || inactiveSessions.length > 0) {
        this.logger.log(
          `Session cleanup completed: ${expiredSessions.length} expired, ${inactiveSessions.length} abandoned`,
        );
      }
    } catch (error) {
      this.logger.error('Error during session timeout cleanup', error);
    }
  }
}
