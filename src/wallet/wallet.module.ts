import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletSessionGuard } from './guards/wallet-session.guard';

@Module({
  imports: [ConfigModule],
  controllers: [WalletController],
  providers: [WalletService, WalletSessionGuard],
  exports: [WalletService],
})
export class WalletModule {}
