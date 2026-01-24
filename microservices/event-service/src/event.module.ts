import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventSchedulerService } from './event-scheduler.service';
import { TournamentService } from './tournament.service';
import { ChallengeRotationService } from './challenge-rotation.service';
import { RewardDistributionService } from './reward-distribution.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { Tournament } from './tournament.entity';
import { Challenge } from './challenge.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Event, Tournament, Challenge]),
  ],
  providers: [
    EventSchedulerService,
    TournamentService,
    ChallengeRotationService,
    RewardDistributionService,
  ],
})
export class EventModule {}
