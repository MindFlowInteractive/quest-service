import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalletService } from '../services/wallet.service';
import { WalletController } from '../controllers/wallet.controller';
import { StellarService } from '../services/stellar.service';

@Module({
  imports: [ConfigModule],
  controllers: [WalletController],
  providers: [WalletService, StellarService],
  exports: [WalletService],
})
export class WalletModule {}