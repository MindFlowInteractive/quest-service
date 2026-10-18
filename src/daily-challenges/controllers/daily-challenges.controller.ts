import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { DailyChallengesService } from '../services/daily-challenges.service';
import { ChallengeAnalyticsService } from '../services/challenge-analytics.service';
import { CompleteChallengeDto } from '../dto/complete-challenge.dto';
import { GrantGracePeriodDto } from '../dto/grant-grace-period.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';

// Ensure the Request type has user property injected by passport-jwt
interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: string };
}

@Controller('challenges')
@UseGuards(JwtAuthGuard)
export class DailyChallengesController {
  constructor(
    private readonly dailyChallengesService: DailyChallengesService,
    private readonly challengeAnalyticsService: ChallengeAnalyticsService,
  ) {}

  // Daily Challenge Endpoints

  @Get('daily')
  async getTodayChallenge(@Req() req: AuthenticatedRequest) {
    return this.dailyChallengesService.getActiveChallenge(req.user.id);
  }

  @Post('daily/complete')
  async completeDailyChallenge(
    @Body() body: { challengeId: string; score: number; timeSpent: number },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dailyChallengesService.completeDailyChallenge(
      req.user.id,
      body.challengeId,
      { score: body.score, timeSpent: body.timeSpent },
    );
  }

  @Post(':completionId/claim-bonus-xp')
  async claimBonusXP(
    @Param('completionId') completionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dailyChallengesService.claimBonusXP(req.user.id, completionId);
  }

  // Weekly Challenge Endpoints

  @Get('weekly')
  async getWeeklyChallenge(@Req() req: AuthenticatedRequest) {
    return this.dailyChallengesService.getActiveWeeklyChallenge(req.user.id);
  }

  @Post('weekly/:weeklyChallengeId/complete/:puzzleId')
  async completeWeeklyPuzzle(
    @Param('weeklyChallengeId') weeklyChallengeId: string,
    @Param('puzzleId') puzzleId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dailyChallengesService.completeWeeklyPuzzle(
      req.user.id,
      weeklyChallengeId,
      puzzleId,
    );
  }

  // Streak Endpoints

  @Get('streak')
  async getStreak(@Req() req: AuthenticatedRequest) {
    return this.dailyChallengesService.getStreakStatus(req.user.id);
  }

  @Get('streak/leaderboard')
  async streakLeaderboard(@Query('limit') limit?: string) {
    return this.dailyChallengesService.getStreakLeaderboard(
      limit ? Number(limit) : 10,
    );
  }

  @Post('streak/grace-period')
  async grantGracePeriod(
    @Req() req: AuthenticatedRequest,
    @Body() dto: GrantGracePeriodDto,
  ) {
    return this.dailyChallengesService.grantGracePeriod(
      req.user.id,
      dto?.hours ?? 24,
    );
  }

  // Analytics Endpoints

  @Get('analytics/overview')
  async participationOverview(@Query('days') days?: string) {
    return this.challengeAnalyticsService.getParticipationOverview(
      days ? Number(days) : 7,
    );
  }

  @Get('analytics/streaks')
  async streakDistribution() {
    return this.challengeAnalyticsService.getStreakDistribution();
  }

  @Get('analytics/weekly')
  async weeklyOverview() {
    return this.challengeAnalyticsService.getWeeklyOverview();
  }

  @Get('analytics/:challengeId')
  async challengeAnalytics(@Param('challengeId') challengeId: string) {
    return this.challengeAnalyticsService.getChallengeAnalytics(challengeId);
  }

  // History and Legacy Endpoints

  @Get('history')
  async getHistory(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit: number,
    @Query('type') type?: 'daily' | 'weekly',
  ) {
    return this.dailyChallengesService.getHistory(
      req.user.id,
      limit || 30,
      type,
    );
  }

  // Legacy endpoint for backward compatibility
  @Post(':id/complete')
  async completeChallenge(
    @Param('id') challengeId: string,
    @Body() body: CompleteChallengeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dailyChallengesService.completeChallenge(
      req.user.id,
      challengeId,
      body,
    );
  }

  // Legacy endpoint for backward compatibility
  @Get('today')
  async getTodayChallengeLegacy(@Req() req: AuthenticatedRequest) {
    return this.getTodayChallenge(req);
  }
}
