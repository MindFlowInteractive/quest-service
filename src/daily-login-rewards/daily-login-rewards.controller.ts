import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { DailyLoginRewardsService } from './daily-login-rewards.service';
import {
  ClaimDailyRewardDto,
  CreateCalendarDto,
  UpdateCalendarDto,
} from './dto/daily-login-rewards.dto';

@Controller('daily-login-rewards')
export class DailyLoginRewardsController {
  constructor(
    private readonly dailyLoginRewardsService: DailyLoginRewardsService,
  ) {}

  // ─── Calendar configuration (admin / service-to-service) ─────────────────

  /**
   * POST /daily-login-rewards/calendars
   * Creates a new reward calendar configuration.
   */
  @Post('calendars')
  createCalendar(@Body() dto: CreateCalendarDto) {
    return this.dailyLoginRewardsService.createCalendar(dto);
  }

  /**
   * PATCH /daily-login-rewards/calendars/:calendarId
   * Updates an existing calendar configuration.
   */
  @Patch('calendars/:calendarId')
  updateCalendar(
    @Param('calendarId') calendarId: string,
    @Body() dto: UpdateCalendarDto,
  ) {
    return this.dailyLoginRewardsService.updateCalendar(calendarId, dto);
  }

  /**
   * GET /daily-login-rewards/calendars
   * Lists all calendar configurations.
   */
  @Get('calendars')
  findAllCalendars() {
    return this.dailyLoginRewardsService.findAllCalendars();
  }

  // ─── Player endpoints (authenticated) ────────────────────────────────────

  /**
   * GET /daily-login-rewards/calendars/:calendarId/status
   * Returns the authenticated player's current position in the reward calendar,
   * including whether they have already claimed today.
   */
  @Get('calendars/:calendarId/status')
  @UseGuards(JwtAuthGuard)
  getStatus(
    @ActiveUser() user: { userId?: string; id?: string },
    @Param('calendarId') calendarId: string,
    @Body() body: { timezone?: string },
  ) {
    const userId = user?.userId ?? user?.id ?? '';
    return this.dailyLoginRewardsService.getStatus(
      userId,
      calendarId,
      body?.timezone,
    );
  }

  /**
   * POST /daily-login-rewards/calendars/:calendarId/claim
   * Claims today's login reward for the authenticated player.
   * Idempotent: returns the existing claim when called multiple times on the
   * same calendar day.
   */
  @Post('calendars/:calendarId/claim')
  @UseGuards(JwtAuthGuard)
  claimDailyReward(
    @ActiveUser() user: { userId?: string; id?: string },
    @Param('calendarId') calendarId: string,
    @Body() dto: ClaimDailyRewardDto,
  ) {
    const userId = user?.userId ?? user?.id ?? '';
    return this.dailyLoginRewardsService.claimDailyReward(
      userId,
      calendarId,
      dto,
    );
  }

  /**
   * GET /daily-login-rewards/calendars/:calendarId/history
   * Returns the authenticated player's full claim history for the given calendar.
   */
  @Get('calendars/:calendarId/history')
  @UseGuards(JwtAuthGuard)
  getClaimHistory(
    @ActiveUser() user: { userId?: string; id?: string },
    @Param('calendarId') calendarId: string,
  ) {
    const userId = user?.userId ?? user?.id ?? '';
    return this.dailyLoginRewardsService.getClaimHistory(userId, calendarId);
  }
}
