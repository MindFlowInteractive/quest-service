import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { QuestChainProgressionService } from '../services/quest-chain-progression.service';
import { PuzzleCompletionDto } from '../dto/puzzle-completion.dto';
import { UserQuestChainProgress } from '../entities/user-quest-chain-progress.entity';

@ApiTags('Quest Chain Progress')
@Controller('quest-chains')
export class QuestChainProgressController {
  constructor(
    private readonly progressionService: QuestChainProgressionService,
  ) {}

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a quest chain for a user' })
  @ApiResponse({ status: 201, description: 'Quest chain started successfully', type: UserQuestChainProgress })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Quest chain not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  async startChain(
    @Param('id') chainId: string,
    @Body('userId') userId: string,
  ): Promise<UserQuestChainProgress> {
    return this.progressionService.startChain(userId, chainId);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get user progress for a quest chain' })
  @ApiResponse({ status: 200, description: 'User progress details', type: UserQuestChainProgress })
  @ApiResponse({ status: 404, description: 'Progress not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  async getProgress(
    @Param('id') chainId: string,
    @Body('userId') userId: string,
  ): Promise<UserQuestChainProgress> {
    return this.progressionService.getProgress(userId, chainId);
  }

  @Get(':id/next-puzzle')
  @ApiOperation({ summary: 'Get the next available puzzle in the quest chain' })
  @ApiResponse({ status: 200, description: 'Next puzzle details' })
  @ApiResponse({ status: 404, description: 'No next puzzle available or progress not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  async getNextPuzzle(
    @Param('id') chainId: string,
    @Body('userId') userId: string,
  ): Promise<any> {
    return this.progressionService.getNextPuzzle(userId, chainId);
  }

  @Post(':id/puzzles/:puzzleId/complete')
  @ApiOperation({ summary: 'Complete a puzzle in the quest chain' })
  @ApiResponse({ status: 200, description: 'Puzzle completed successfully', type: UserQuestChainProgress })
  @ApiResponse({ status: 400, description: 'Bad request or unlock conditions not met' })
  @ApiResponse({ status: 404, description: 'Puzzle or progress not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  @ApiParam({ name: 'puzzleId', description: 'Puzzle ID' })
  @ApiBody({ type: PuzzleCompletionDto })
  async completePuzzle(
    @Param('id') chainId: string,
    @Param('puzzleId') puzzleId: string,
    @Body('userId') userId: string,
    @Body(ValidationPipe) completionData: PuzzleCompletionDto,
  ): Promise<UserQuestChainProgress> {
    return this.progressionService.completePuzzle(userId, chainId, puzzleId, completionData);
  }

  @Post(':id/reset')
  @ApiOperation({ summary: 'Reset user progress for a quest chain' })
  @ApiResponse({ status: 204, description: 'Progress reset successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Progress not found' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  async resetProgress(
    @Param('id') chainId: string,
    @Body('userId') userId: string,
  ): Promise<void> {
    return this.progressionService.resetProgress(userId, chainId);
  }
}