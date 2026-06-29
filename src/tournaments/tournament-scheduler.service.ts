import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TournamentEventsService } from './tournament-events.service';

@Injectable()
export class TournamentSchedulerService {
  private readonly logger = new Logger(TournamentSchedulerService.name);

  constructor(private readonly tournamentEventsService: TournamentEventsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTournamentLifecycle() {
    this.logger.debug('Checking tournament events for status updates');

    try {
      await this.tournamentEventsService.processScheduledEvents();
    } catch (error) {
      this.logger.error('Error processing scheduled tournament events', error);
    }
  }
}