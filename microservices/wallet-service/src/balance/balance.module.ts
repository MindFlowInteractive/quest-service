import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Balance } from './entities/balance.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { BalanceService } from './balance.service';
import { BalanceController } from './balance.controller';
import { StellarModule } from '../../stellar/stellar.module';

@Module({
  imports: [TypeOrmModule.forFeature([Balance, Wallet]), StellarModule],
  providers: [BalanceService],
  controllers: [BalanceController],
  exports: [BalanceService],
})
export class BalanceModule {}
