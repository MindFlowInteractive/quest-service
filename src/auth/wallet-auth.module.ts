import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletAuthService } from './wallet-auth.service';
import { WalletAuthController } from './wallet-auth.controller';
import { WalletUser } from './entities/wallet-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WalletUser])],
  providers: [WalletAuthService],
  controllers: [WalletAuthController],
})
export class WalletAuthModule {}
