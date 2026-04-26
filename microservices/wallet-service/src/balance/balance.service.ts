import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Balance } from './entities/balance.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { StellarService } from '../../stellar/stellar.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(
    @InjectRepository(Balance)
    private balanceRepository: Repository<Balance>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private stellarService: StellarService,
  ) {}

  async syncBalances(walletId: string) {
    const wallet = await this.walletRepository.findOne({ where: { id: walletId } });
    if (!wallet) return;

    try {
      const stellarBalances = await this.stellarService.getAccountBalances(wallet.address);
      
      for (const sb of stellarBalances) {
        let balance = await this.balanceRepository.findOne({
          where: {
            walletId,
            assetCode: sb.asset_code,
            assetIssuer: sb.asset_issuer || null,
          },
        });

        if (!balance) {
          balance = this.balanceRepository.create({
            walletId,
            assetCode: sb.asset_code,
            assetIssuer: sb.asset_issuer || null,
          });
        }

        balance.balance = sb.balance;
        balance.lastSyncedAt = new Date();
        await this.balanceRepository.save(balance);
      }
      
      this.logger.log(`Synced balances for wallet ${wallet.address}`);
    } catch (error) {
      this.logger.error(`Failed to sync balances for wallet ${wallet.address}: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async syncAllWallets() {
    this.logger.log('Starting global balance sync...');
    const wallets = await this.walletRepository.find();
    for (const wallet of wallets) {
      await this.syncBalances(wallet.id);
    }
    this.logger.log('Global balance sync completed.');
  }

  async getBalancesByWallet(walletId: string) {
    return this.balanceRepository.find({ where: { walletId } });
  }
}
