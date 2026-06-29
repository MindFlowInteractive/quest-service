import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletAnalyticsController } from './wallet-analytics.controller';
import { StellarModule } from '../stellar/stellar.module';
import { Balance } from '../balance/entities/balance.entity';
import { Transaction } from '../transaction/entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, Balance, Transaction]), StellarModule],
  providers: [WalletService],
  controllers: [WalletController, WalletAnalyticsController],
  exports: [WalletService],
})
export class WalletModule {}
