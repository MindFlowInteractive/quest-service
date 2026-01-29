import { Module } from '@nestjs/common';
import { DifficultyScalingService } from './difficulty-scaling.service';
import { PlayerSkillService } from './player-skill.service';
import { PuzzleDifficultyService } from './puzzle-difficulty.service';

@Module({
  providers: [DifficultyScalingService, PlayerSkillService, PuzzleDifficultyService],
  exports: [DifficultyScalingService, PlayerSkillService, PuzzleDifficultyService],
})
export class DifficultyScalingModule {}
