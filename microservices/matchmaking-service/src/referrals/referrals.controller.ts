import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralLeaderboardService } from './referral-leaderboard.service';
import { ReferralAnalyticsService } from './referral-analytics.service';
import { CreateReferralCodeDto } from './dto/create-referral-code.dto';
import { UseReferralCodeDto } from './dto/use-referral-code.dto';
import { ReferralAnalyticsDto } from './dto/referral-analytics.dto';
import { ReferralLeaderboardDto } from './dto/referral-leaderboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('referrals')
export class ReferralsController {
  constructor(
    private readonly referralsService: ReferralsService,
    private readonly leaderboardService: ReferralLeaderboardService,
    private readonly analyticsService: ReferralAnalyticsService,
  ) {}

  /**
   * Generate or get referral code for current user
   */
  @Post('code')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReferralCode(
    @Request() req: any,
    @Body() createDto?: CreateReferralCodeDto,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.referralsService.generateReferralCode(userId, createDto);
  }

  /**
   * Get referral code for current user
   */
  @Get('code')
  @UseGuards(JwtAuthGuard)
  async getReferralCode(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.referralsService.getReferralCode(userId);
  }

  /**
   * Generate invite link for current user
   */
  @Get('invite-link')
  @UseGuards(JwtAuthGuard)
  async getInviteLink(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    const link = await this.referralsService.generateInviteLink(userId);
    return { inviteLink: link };
  }

  /**
   * Use a referral code (for new user registration)
   */
  @Post('use')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async useReferralCode(
    @Body() useDto: UseReferralCodeDto,
    @Request() req: any,
  ) {
    const refereeId = req.user?.id || req.user?.sub;
    const metadata = {
      registrationIp: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.referralsService.useReferralCode(refereeId, useDto, metadata);
  }

  /**
   * Get referral stats for current user
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getReferralStats(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.referralsService.getReferralStats(userId);
  }

  /**
   * Get referrals for current user (as referrer)
   */
  @Get('my-referrals')
  @UseGuards(JwtAuthGuard)
  async getMyReferrals(
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.referralsService.getReferralsByReferrer(
      userId,
      status as any,
    );
  }

  /**
   * Get referral by ID
   */
  @Get(':id')
  async getReferral(@Param('id') id: string) {
    return this.referralsService.getReferralById(id);
  }

  /**
   * Complete a referral
   */
  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async completeReferral(@Param('id') id: string) {
    return this.referralsService.completeReferral(id);
  }

  /**
   * Get referral leaderboard
   */
  @Get('leaderboard/all')
  async getLeaderboard(@Query() query: ReferralLeaderboardDto) {
    return this.leaderboardService.getLeaderboard(
      query.type,
      query.limit,
      query.offset,
    );
  }

  /**
   * Get user's rank in leaderboard
   */
  @Get('leaderboard/rank')
  @UseGuards(JwtAuthGuard)
  async getUserRank(
    @Request() req: any,
    @Query('type') type?: string,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.leaderboardService.getUserRank(userId, type as any);
  }

  /**
   * Get referral analytics
   */
  @Get('analytics/dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.analyticsService.getDashboardSummary(userId);
  }

  /**
   * Get comprehensive referral analytics
   */
  @Get('analytics/overview')
  async getAnalytics(@Query() query: ReferralAnalyticsDto) {
    return this.analyticsService.getAnalytics(query);
  }
}
