import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';

import { BlockchainTransactionController } from './blockchain-transaction.controller';
import { BlockchainTransactionService } from './blockchain-transaction.service';
import { BlockchainTransaction } from './entities/blockchain-transaction.entity';

import {
  HorizonApiService,
  TransactionParserService,
  TransactionMonitorService,
  TransactionRetryService,
  TransactionAnalyticsService,
  TransactionNotificationService,
} from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlockchainTransaction]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ConfigModule,
  ],
  controllers: [BlockchainTransactionController],
  providers: [
    BlockchainTransactionService,
    HorizonApiService,
    TransactionParserService,
    TransactionMonitorService,
    TransactionRetryService,
    TransactionAnalyticsService,
    TransactionNotificationService,
  ],
  exports: [
    BlockchainTransactionService,
    HorizonApiService,
    TransactionParserService,
    TransactionMonitorService,
    TransactionRetryService,
    TransactionAnalyticsService,
  ],
})
export class BlockchainTransactionModule {}
