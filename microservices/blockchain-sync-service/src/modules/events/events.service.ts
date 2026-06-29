import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StellarService } from '../../stellar/stellar.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly stellarService: StellarService,
  ) {}

  @Cron('*/10 * * * * *')
  async listenToContractEvents() {
    try {
      const server = this.stellarService.getServer();

      const events = await server
        .operations()
        .limit(20)
        .order('desc')
        .call();

      for (const event of events.records) {
        this.logger.log(`Event captured: ${event.id}`);

        // persist event
        // trigger webhook
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}