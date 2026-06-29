import { Controller, Get, Post, Param, ParseUUIDPipe } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('wallet/:walletId')
  @ApiOperation({ summary: 'Get transaction history for a specific wallet' })
  async getByWallet(@Param('walletId', ParseUUIDPipe) walletId: string) {
    return this.transactionService.getTransactionsByWallet(walletId);
  }

  @Post('wallet/:walletId/sync')
  @ApiOperation({ summary: 'Manually trigger transaction sync for a wallet' })
  async sync(@Param('walletId', ParseUUIDPipe) walletId: string) {
    await this.transactionService.syncTransactions(walletId);
    return { message: 'Sync initiated' };
  }
}
