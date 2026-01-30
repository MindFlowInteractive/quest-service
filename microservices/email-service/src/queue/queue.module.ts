import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailQueue } from './entities/email-queue.entity';
import { Email } from '../emails/entities/email.entity';
import { QueueService } from './queue.service';
import { EmailProcessor } from './email.processor';
import { ProvidersModule } from '../providers/providers.module';
import { UnsubscribeModule } from '../unsubscribe/unsubscribe.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailQueue, Email]),
    BullModule.registerQueueAsync({
      name: 'email-queue',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        defaultJobOptions: {
          attempts: configService.get<number>('email.queue.maxRetries', 5),
          backoff: {
            type: 'exponential',
            delay: configService.get<number>('email.queue.initialDelay', 1000),
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    ProvidersModule,
    forwardRef(() => UnsubscribeModule),
  ],
  providers: [QueueService, EmailProcessor],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
