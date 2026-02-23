import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletService } from './wallet.service';
import { WalletBalanceHistory } from './entities/wallet-balance-history.entity';
import { CacheService } from '../cache/services/cache.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class WalletSyncService {
  private readonly logger = new Logger(WalletSyncService.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly cacheService: CacheService,
    private readonly notificationService: NotificationService,
    @InjectRepository(WalletBalanceHistory)
    private readonly historyRepo: Repository<WalletBalanceHistory>,
  ) {}

  async syncBalances(session: any) {
    const cacheKey = `wallet:balance:${session.publicKey}:${session.network}`;

    const previous = await this.cacheService.get(cacheKey);
    const fresh = await this.walletService.getBalances(session);

    await this.cacheService.set(cacheKey, fresh, { ttl: 60 });

    if (previous) {
      await this.detectChanges(session, previous, fresh);
    }

    return fresh;
  }

  private async detectChanges(session: any, oldData: any, newData: any) {
    const oldMap = new Map(
      oldData.balances.map((b: any) => [b.asset.code, b.balance]),
    );

    for (const balance of newData.balances) {
      const previous = oldMap.get(balance.asset.code);

      if (previous !== balance.balance) {
        await this.recordHistory(session, balance);

        if (balance.asset.code === 'XLM') {
          await this.notificationService.createNotificationForUsers({
            userIds: [session.publicKey],
            type: 'wallet_low_balance',
            title: 'Low XLM Balance',
            body: 'Your XLM balance has changed.',
          });
        }
      }
    }
  }

  private async recordHistory(session: any, balance: any) {
    const record = this.historyRepo.create({
      publicKey: session.publicKey,
      network: session.network,
      assetCode: balance.asset.code,
      issuer: balance.asset.issuer || null,
      balance: balance.balance,
    });

    await this.historyRepo.save(record);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async periodicRefresh() {
    this.logger.log('Running periodic wallet sync...');
  }
}