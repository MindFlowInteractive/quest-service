import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { Player } from './entities/player.entity';
import { PlayerProfile } from './entities/player-profile.entity';
import { PlayerProgress } from './entities/player-progress.entity';
import { PlayerExportSchedule } from './entities/player-export-schedule.entity';
import { PlayerDataPortabilityService } from './player-data-portability.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Player,
      PlayerProfile,
      PlayerProgress,
      PlayerExportSchedule,
    ]),
  ],
  controllers: [PlayerController],
  providers: [PlayerService, PlayerDataPortabilityService],
  exports: [PlayerService],
})
export class PlayerModule {}
