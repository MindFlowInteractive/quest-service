import { Controller, Get, Post, Param, ParseUUIDPipe } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('balances')
@Controller('balances')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('wallet/:walletId')
  @ApiOperation({ summary: 'Get balances for a specific wallet' })
  async getByWallet(@Param('walletId', ParseUUIDPipe) walletId: string) {
    return this.balanceService.getBalancesByWallet(walletId);
  }

  @Post('wallet/:walletId/sync')
  @ApiOperation({ summary: 'Manually trigger balance sync for a wallet' })
  async sync(@Param('walletId', ParseUUIDPipe) walletId: string) {
    await this.balanceService.syncBalances(walletId);
    return { message: 'Sync initiated' };
  }
}
