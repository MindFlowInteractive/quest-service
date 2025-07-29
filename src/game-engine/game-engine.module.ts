import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzleEngineService } from './services/puzzle-engine.service';
import { StateManagementService } from './services/state-management.service';
import { ValidationService } from './services/validation.service';
import { DifficultyScalingService } from './services/difficulty-scaling.service';
import { ProgressionService } from './services/progression.service';
import { HintSystemService } from './services/hint-system.service';
import { AnalyticsService } from './services/analytics.service';
import { SequenceGeneratorService } from './services/sequence-generator.service';
import { CauseEffectEngineService } from './services/cause-effect-engine.service';
import { SaveLoadService } from './services/save-load.service';
import { PuzzleGeneratorService } from './services/puzzle-generator.service';
import { PuzzleRegistryService } from './services/puzzle-registry.service';
import { ScoringService } from './services/scoring.service';
import { AchievementsService } from './services/achievements.service';
import { PuzzleController } from './controllers/puzzle.controller';
import { GameStateController } from './controllers/game-state.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { PuzzleState } from './entities/puzzle-state.entity';
import { PlayerProgress } from './entities/player-progress.entity';
import { GameSession } from './entities/game-session.entity';
import { PuzzleAnalytics } from './entities/puzzle-analytics.entity';
import { gameEngineConfig } from './config/game-engine.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(gameEngineConfig),
    TypeOrmModule.forFeature([
      PuzzleState,
      PlayerProgress,
      GameSession,
      PuzzleAnalytics,
    ]),
  ],
  providers: [
    PuzzleEngineService,
    StateManagementService,
    ValidationService,
    DifficultyScalingService,
    ProgressionService,
    HintSystemService,
    AnalyticsService,
    SequenceGeneratorService,
    CauseEffectEngineService,
    SaveLoadService,
    PuzzleGeneratorService,
    PuzzleRegistryService,
    ScoringService,
    AchievementsService,
  ],
  controllers: [PuzzleController, GameStateController, AnalyticsController],
  exports: [
    PuzzleEngineService,
    StateManagementService,
    ValidationService,
    DifficultyScalingService,
    ProgressionService,
    HintSystemService,
    AnalyticsService,
    SequenceGeneratorService,
    CauseEffectEngineService,
    SaveLoadService,
    PuzzleGeneratorService,
    PuzzleRegistryService,
    ScoringService,
    AchievementsService,
  ],
})
export class GameEngineModule {}
