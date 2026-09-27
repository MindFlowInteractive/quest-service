import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import {
  CommunityEvent,
  EventParticipation,
  EventMilestone,
} from './entities';
import { CommunityEventsService } from './community-events.service';
import { CommunityEventsController } from './community-events.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommunityEvent, EventParticipation, EventMilestone]),
    ScheduleModule.forRoot(),
  ],
  controllers: [CommunityEventsController],
  providers: [CommunityEventsService],
  exports: [CommunityEventsService],
})
export class CommunityEventsModule {}
