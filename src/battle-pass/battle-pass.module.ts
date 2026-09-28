import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BattlePass, BattlePassTier, PlayerBattlePass } from './entities';
import { BattlePassService } from './battle-pass.service';
import { BattlePassController } from './battle-pass.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BattlePass, BattlePassTier, PlayerBattlePass]),
    ScheduleModule.forRoot(),
  ],
  controllers: [BattlePassController],
  providers: [BattlePassService],
  exports: [BattlePassService],
})
export class BattlePassModule {}
