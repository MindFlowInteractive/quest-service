import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import antiCheatConfig from './config/anti-cheat.config';
import { CheatViolation } from './entities/cheat-violation.entity';
import { PlayerBehaviorProfile } from './entities/player-behavior-profile.entity';
import { PuzzleMoveAudit } from './entities/puzzle-move-audit.entity';
import { AntiCheatService } from './services/anti-cheat.service';
import { DetectionService } from './services/detection.service';
import { AntiCheatGuard } from './guards/anti-cheat.guard';

/**
 * Anti-Cheat Module
 * Provides comprehensive puzzle validation and anti-cheat detection
 */
@Module({
  imports: [
    ConfigModule.forFeature(antiCheatConfig),
    TypeOrmModule.forFeature([
      CheatViolation,
      PlayerBehaviorProfile,
      PuzzleMoveAudit
    ])
  ],
  providers: [
    AntiCheatService,
    DetectionService,
    AntiCheatGuard
  ],
  exports: [
    AntiCheatService,
    DetectionService,
    AntiCheatGuard
  ]
})
export class AntiCheatModule {}
