import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationEngineService } from '../services/recommendation-engine.service';
import { PreferenceTrackingService } from '../services/preference-tracking.service';
import { GetRecommendationsDto, RecommendationResponseDto, TrackInteractionDto } from '../dto/recommendation.dto';

@ApiTags('recommendations')
@Controller('recommendations')
@ApiBearerAuth()
export class RecommendationsController {
  constructor(
    private recommendationEngineService: RecommendationEngineService,
    private preferenceTrackingService: PreferenceTrackingService,
  ) {}

  @Get('puzzles/:userId')
  @ApiOperation({ summary: 'Get personalized puzzle recommendations for a user' })
  @ApiResponse({
    status: 200,
    description: 'List of recommended puzzles',
    type: [RecommendationResponseDto],
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of recommendations (1-50)' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by puzzle category' })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard', 'expert'] })
  @ApiQuery({ name: 'algorithm', required: false, enum: ['collaborative', 'content-based', 'hybrid', 'popular'] })
  @ApiQuery({ name: 'abTestGroup', required: false, type: String, description: 'A/B test group identifier' })
  async getRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: 'easy' | 'medium' | 'hard' | 'expert',
    @Query('algorithm') algorithm?: 'collaborative' | 'content-based' | 'hybrid' | 'popular',
    @Query('abTestGroup') abTestGroup?: string,
  ): Promise<RecommendationResponseDto[]> {
    try {
      const recommendations = await this.recommendationEngineService.generateRecommendations(
        userId,
        limit || 10,
        category,
        difficulty,
        algorithm,
        abTestGroup,
      );

      return recommendations.map(rec => ({
        id: rec.puzzle.id,
        puzzleId: rec.puzzleId,
        title: rec.puzzle.title,
        description: rec.puzzle.description,
        category: rec.puzzle.category,
        difficulty: rec.puzzle.difficulty,
        difficultyRating: rec.puzzle.difficultyRating,
        averageRating: rec.puzzle.averageRating,
        completions: rec.puzzle.completions,
        tags: rec.puzzle.tags,
        score: rec.score,
        reason: rec.reason,
        algorithm: rec.algorithm,
        metadata: rec.metadata,
      }));
    } catch (error) {
      throw new HttpException(
        'Failed to generate recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('interactions')
  @ApiOperation({ summary: 'Track user interaction with puzzles' })
  @ApiResponse({ status: 201, description: 'Interaction tracked successfully' })
  async trackInteraction(@Body() trackInteractionDto: TrackInteractionDto): Promise<{ success: boolean }> {
    try {
      await this.recommendationEngineService.trackInteraction(
        trackInteractionDto.userId,
        trackInteractionDto.puzzleId,
        trackInteractionDto.interactionType,
        trackInteractionDto.value,
        trackInteractionDto.metadata,
      );

      return { success: true };
    } catch (error) {
      throw new HttpException(
        'Failed to track interaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('puzzle-completed')
  @ApiOperation({ summary: 'Record puzzle completion for preference learning' })
  @ApiResponse({ status: 201, description: 'Puzzle completion recorded' })
  async recordPuzzleCompletion(
    @Body() body: {
      userId: string;
      puzzleId: string;
      completionTime: number;
      hintsUsed: number;
      attempts: number;
      score: number;
    },
  ): Promise<{ success: boolean }> {
    try {
      await this.preferenceTrackingService.onPuzzleCompleted(
        body.userId,
        body.puzzleId,
        body.completionTime,
        body.hintsUsed,
        body.attempts,
        body.score,
      );

      return { success: true };
    } catch (error) {
      throw new HttpException(
        'Failed to record puzzle completion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('puzzle-rated')
  @ApiOperation({ summary: 'Record puzzle rating for preference learning' })
  @ApiResponse({ status: 201, description: 'Puzzle rating recorded' })
  async recordPuzzleRating(
    @Body() body: {
      userId: string;
      puzzleId: string;
      rating: number;
      difficultyVote?: string;
    },
  ): Promise<{ success: boolean }> {
    try {
      await this.preferenceTrackingService.onPuzzleRated(
        body.userId,
        body.puzzleId,
        body.rating,
        body.difficultyVote,
      );

      return { success: true };
    } catch (error) {
      throw new HttpException(
        'Failed to record puzzle rating',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('preferences/:userId')
  @ApiOperation({ summary: 'Get user preferences and insights' })
  @ApiResponse({ status: 200, description: 'User preference insights' })
  async getUserPreferences(@Param('userId') userId: string): Promise<any> {
    try {
      const insights = await this.preferenceTrackingService.getPreferenceInsights(userId);
      return insights;
    } catch (error) {
      throw new HttpException(
        'Failed to get user preferences',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get recommendation system metrics' })
  @ApiResponse({ status: 200, description: 'Recommendation metrics' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'algorithm', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getMetrics(
    @Query('userId') userId?: string,
    @Query('algorithm') algorithm?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      const metrics = await this.recommendationEngineService.getRecommendationMetrics(
        userId,
        algorithm,
        start,
        end,
      );

      return metrics;
    } catch (error) {
      throw new HttpException(
        'Failed to get recommendation metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('popular/:category?')
  @ApiOperation({ summary: 'Get popular puzzles (fallback recommendations)' })
  @ApiResponse({ status: 200, description: 'List of popular puzzles' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard', 'expert'] })
  async getPopularPuzzles(
    @Param('category') category?: string,
    @Query('limit') limit?: number,
    @Query('difficulty') difficulty?: 'easy' | 'medium' | 'hard' | 'expert',
  ): Promise<RecommendationResponseDto[]> {
    try {
      // Use a dummy user ID for popular recommendations
      const recommendations = await this.recommendationEngineService.generateRecommendations(
        'popular-fallback',
        limit || 10,
        category,
        difficulty,
        'popular',
      );

      return recommendations.map(rec => ({
        id: rec.puzzle.id,
        puzzleId: rec.puzzleId,
        title: rec.puzzle.title,
        description: rec.puzzle.description,
        category: rec.puzzle.category,
        difficulty: rec.puzzle.difficulty,
        difficultyRating: rec.puzzle.difficultyRating,
        averageRating: rec.puzzle.averageRating,
        completions: rec.puzzle.completions,
        tags: rec.puzzle.tags,
        score: rec.score,
        reason: rec.reason,
        algorithm: rec.algorithm,
        metadata: rec.metadata,
      }));
    } catch (error) {
      throw new HttpException(
        'Failed to get popular puzzles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('refresh-preferences/:userId')
  @ApiOperation({ summary: 'Manually refresh user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences refreshed successfully' })
  async refreshUserPreferences(@Param('userId') userId: string): Promise<{ success: boolean }> {
    try {
      await this.preferenceTrackingService.updateUserPreferences(userId);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        'Failed to refresh user preferences',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}