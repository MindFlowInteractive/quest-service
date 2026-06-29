import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StellarService } from '../../stellar/stellar.service';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly stellarService: StellarService,
  ) {}

  @Cron('*/5 * * * * *')
  async monitorTransactions() {
    try {
      const server = this.stellarService.getServer();

      const transactions = await server
        .transactions()
        .limit(20)
        .order('desc')
        .call();

      for (const tx of transactions.records) {
        this.logger.log(`Transaction detected: ${tx.hash}`);

        // persist tx
        // trigger webhook
        // index tx
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}