// src/puzzles/ai-assistant/ai-assistant.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { EffectivenessTrackerService } from './effectiveness-tracker.service';
import { LearningPathService } from './learning-path.service';
import {
  HintRequestDto,
  ThinkingProcessRequestDto,
} from './dto/hint-request.dto';

// Assume you have an auth guard
// import { AuthGuard } from '@nestjs/passport';

@Controller('puzzles/ai-assistant')
// @UseGuards(AuthGuard('jwt'))
export class AiAssistantController {
  constructor(
    private readonly aiAssistant: AiAssistantService,
    private readonly effectivenessTracker: EffectivenessTrackerService,
    private readonly learningPath: LearningPathService,
  ) {}

  @Post('hint')
  async getHint(@Body() request: HintRequestDto, @Request() req: any) {
    // Use authenticated user ID
    const userId = request.userId || req.user?.id;
    
    return this.aiAssistant.getProgressiveHint({
      ...request,
      userId,
    });
  }

  @Post('thinking-process')
  async getThinkingProcess(
    @Body() request: ThinkingProcessRequestDto,
    @Request() req: any
  ) {
    const userId = request.userId || req.user?.id;
    
    return this.aiAssistant.explainThinkingProcess({
      ...request,
      userId,
    });
  }

  @Get('learning-path/:userId')
  async getLearningPath(@Param('userId') userId: string) {
    return this.aiAssistant.getLearningRecommendations(userId);
  }

  @Post('feedback')
  async submitFeedback(
    @Body() feedback: {
      userId: string;
      puzzleId: string;
      hintId: string;
      wasHelpful: boolean;
      ledToProgress: boolean;
    }
  ) {
    await this.effectivenessTracker.recordHintFeedback(
      feedback.userId,
      feedback.puzzleId,
      feedback.hintId,
      feedback.wasHelpful,
      feedback.ledToProgress
    );

    return { message: 'Feedback recorded successfully' };
  }

  @Get('effectiveness/:userId')
  async getEffectiveness(@Param('userId') userId: string) {
    return this.effectivenessTracker.calculateEffectiveness(userId);
  }

  @Get('insights/:userId')
  async getInsights(@Param('userId') userId: string) {
    return this.effectivenessTracker.getInsights(userId);
  }

  @Post('puzzle/complete')
  async recordPuzzleCompletion(
    @Body() completion: {
      userId: string;
      puzzleId: string;
      performance: {
        success: boolean;
        hintsUsed: number;
        timeSpent: number;
        strategiesUsed: string[];
      };
    }
  ) {
    await this.learningPath.updatePlayerProfile(
      completion.userId,
      completion.puzzleId,
      completion.performance
    );

    return { message: 'Puzzle completion recorded' };
  }

  @Get('analyze/:puzzleId')
  async analyzePuzzle(
    @Param('puzzleId') puzzleId: string,
    @Body() state: any,
    @Request() req: any
  ) {
    const userId = req.user?.id;
    return this.aiAssistant.analyzePuzzle(state, userId);
  }
}