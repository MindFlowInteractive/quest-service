import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

import { OnChainEvent } from './entities/onchain-event.entity';
import { DeadLetterEvent } from './entities/dead-letter-event.entity';
import { BlockchainEventsService } from './blockchain-events.service';
import { EventHandlersService } from './event-handlers.service';
import { BlockchainEventsController } from './blockchain-events.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([OnChainEvent, DeadLetterEvent]),
    ScheduleModule,
    ConfigModule,
  ],
  controllers: [BlockchainEventsController],
  providers: [BlockchainEventsService, EventHandlersService],
  exports: [BlockchainEventsService, EventHandlersService],
})
export class BlockchainEventsModule {}
