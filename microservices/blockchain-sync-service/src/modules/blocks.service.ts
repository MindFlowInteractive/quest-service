import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BlocksService {
  private readonly logger = new Logger(BlocksService.name);

  async checkConfirmations(
    txLedger: number,
    latestLedger: number,
  ) {
    const confirmations = latestLedger - txLedger;

    return {
      confirmed:
        confirmations >=
        Number(process.env.CONFIRMATION_THRESHOLD),
      confirmations,
    };
  }
}