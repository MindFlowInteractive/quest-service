import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeadLetterEvent } from './dead-letter-event.entity';
import { DeadLetterService } from './dead-letter.service';
import { Event } from './event.entity';
import { EventsService } from './events.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, DeadLetterEvent])],
  providers: [EventsService, DeadLetterService],
  exports: [EventsService, DeadLetterService],
})
export class EventsModule {}
