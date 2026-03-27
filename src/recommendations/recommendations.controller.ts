import { Controller, Get, Param, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { SubmitFeedbackDto } from './dto/recommendation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('puzzles')
  async getPersonalizedRecommendations(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.recommendationsService.getPersonalizedRecommendations(userId, Math.min(limitNum, 10));
  }

  @Get('puzzles/trending')
  async getTrendingRecommendations(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.recommendationsService.getTrendingRecommendations(Math.min(limitNum, 10));
  }

  @Post('feedback')
  async submitFeedback(@Request() req: any, @Body() feedback: SubmitFeedbackDto) {
    const userId = req.user.id;
    await this.recommendationsService.submitFeedback(userId, feedback);
    return { success: true };
  }

  // Legacy endpoints for backward compatibility
  @Post('register-puzzle')
  registerPuzzle(@Body() body: { id: string; tags: string[]; difficulty: number }) {
    // This is now handled by the puzzle service
    return { ok: true };
  }

  @Post('upsert-player')
  upsertPlayer(@Body() body: { id: string; skillLevel?: number; preferences?: string[] }) {
    return this.recommendationsService.upsertPlayer(body);
  }

  @Post('track')
  track(@Body() body: { playerId: string; puzzleId: string; type: 'view' | 'click' | 'start' | 'complete' }) {
    this.recommendationsService.trackEvent({ ...body, timestamp: Date.now() });
    return { ok: true };
  }

  @Get(':playerId')
  get(@Param('playerId') playerId: string) {
    return this.recommendationsService.generateRecommendations(playerId);
  }

  @Get('metrics/all')
  metrics() {
    return this.recommendationsService.getMetrics();
  }
}
