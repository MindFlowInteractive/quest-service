import { Module } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';
import { StrategyExplainerService } from './strategy-explainer.service';
import { HintProgressionService } from './hint-progression.service';
import { LearningPathService } from './learning-path.service';
import { EffectivenessTrackerService } from './effectiveness-tracker.service';

@Module({
  controllers: [AiAssistantController],
  providers: [
    AiAssistantService,
    StrategyExplainerService,
    HintProgressionService,
    LearningPathService,
    EffectivenessTrackerService,
  ],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}