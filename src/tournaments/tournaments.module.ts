import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { TournamentEventsService } from './tournament-events.service';
import { TournamentEventsController } from './tournament-events.controller';
import { TournamentSchedulerService } from './tournament-scheduler.service';
import { Tournament } from './entities/tournament.entity';
import { TournamentParticipant } from './entities/tournament-participant.entity';
import { TournamentMatch } from './entities/tournament-match.entity';
import { TournamentSpectator } from './entities/tournament-spectator.entity';
import { TournamentEvent } from './entities/tournament-event.entity';
import { TournamentEventParticipant } from './entities/tournament-event-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament,
      TournamentParticipant,
      TournamentMatch,
      TournamentSpectator,
      TournamentEvent,
      TournamentEventParticipant,
    ]),
  ],
  controllers: [TournamentsController, TournamentEventsController],
  providers: [TournamentsService, TournamentEventsService, TournamentSchedulerService],
  exports: [TournamentsService, TournamentEventsService],
})
export class TournamentsModule {}
