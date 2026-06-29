import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { Player } from './entities/player.entity';
import { PlayerProfile } from './entities/player-profile.entity';
import { PlayerProgress } from './entities/player-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player, PlayerProfile, PlayerProgress]),
  ],
  controllers: [PlayerController],
  providers: [PlayerService],
  exports: [PlayerService],
})
export class PlayerModule {}