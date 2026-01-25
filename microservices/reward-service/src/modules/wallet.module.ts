import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalletService } from '../services/wallet.service';
import { StellarService } from '../services/stellar.service';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [WalletService, StellarService],
  exports: [WalletService],
})
export class WalletModule {}