import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WalletModule } from './wallet/wallet.module';
import { BalanceModule } from './balance/balance.module';
import { TransactionModule } from './transaction/transaction.module';
import { StellarModule } from './stellar/stellar.module';
import { Wallet } from './wallet/entities/wallet.entity';
import { Balance } from './balance/entities/balance.entity';
import { Transaction } from './transaction/entities/transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'wallet_service'),
        entities: [Wallet, Balance, Transaction],
        synchronize: true, // Only for development
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    WalletModule,
    BalanceModule,
    TransactionModule,
    StellarModule,
  ],
})
export class AppModule {}
