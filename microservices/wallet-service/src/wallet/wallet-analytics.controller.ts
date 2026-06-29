import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Balance } from '../balance/entities/balance.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('analytics')
@Controller('analytics')
export class WalletAnalyticsController {
  constructor(
    @InjectRepository(Balance)
    private balanceRepository: Repository<Balance>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  @Get('wallet/:walletId/summary')
  @ApiOperation({ summary: 'Get a summary of wallet activity' })
  async getWalletSummary(@Param('walletId', ParseUUIDPipe) walletId: string) {
    const balances = await this.balanceRepository.find({ where: { walletId } });
    const transactionCount = await this.transactionRepository.count({ where: { walletId } });
    
    return {
      walletId,
      totalAssets: balances.length,
      balances: balances.map(b => ({ asset: b.assetCode, amount: b.balance })),
      totalTransactions: transactionCount,
    };
  }
}
