import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletSessionGuard } from './guards/wallet-session.guard';
import { WalletSyncService } from './wallet-sync.service';
import { WalletBalanceHistory } from './entities/wallet-balance-history.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    CacheModule,
    NotificationsModule,
    TypeOrmModule.forFeature([WalletBalanceHistory]),
  ],
  controllers: [WalletController],
  providers: [
    WalletService,
    WalletSessionGuard,
    WalletSyncService,
  ],
  exports: [WalletService],
})
export class WalletModule {}