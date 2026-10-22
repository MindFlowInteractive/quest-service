import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginRewardCalendar } from './entities/login-reward-calendar.entity';
import { PlayerLoginRewardClaim } from './entities/player-login-reward-claim.entity';
import { PlayerLoginStreak } from './entities/player-login-streak.entity';
import {
  CalendarStatusResponse,
  ClaimDailyRewardDto,
  ClaimRewardResponse,
  CreateCalendarDto,
  UpdateCalendarDto,
} from './dto/daily-login-rewards.dto';

// ─── Timezone helpers ────────────────────────────────────────────────────────

/**
 * Returns the current wall-clock date in the given IANA timezone as a
 * 'YYYY-MM-DD' string.  Falls back to UTC when the timezone string is invalid.
 */
export function todayInTimezone(timezone = 'UTC'): string {
  try {
    // Intl.DateTimeFormat is available in V8 / Node.js and gives us a locale-
    // aware formatter that handles DST automatically.
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    // en-CA locale produces 'YYYY-MM-DD' – stable and predictable.
    return formatter.format(new Date());
  } catch {
    // Invalid timezone → fall back to UTC
    return todayInTimezone('UTC');
  }
}

/**
 * Returns the number of full calendar days between two 'YYYY-MM-DD' strings.
 * The result is always non-negative (uses absolute difference).
 */
export function daysBetween(a: string, b: string): number {
  const msA = new Date(a + 'T00:00:00Z').getTime();
  const msB = new Date(b + 'T00:00:00Z').getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DailyLoginRewardsService {
  private readonly logger = new Logger(DailyLoginRewardsService.name);

  constructor(
    @InjectRepository(LoginRewardCalendar)
    private readonly calendarRepo: Repository<LoginRewardCalendar>,

    @InjectRepository(PlayerLoginRewardClaim)
    private readonly claimRepo: Repository<PlayerLoginRewardClaim>,

    @InjectRepository(PlayerLoginStreak)
    private readonly streakRepo: Repository<PlayerLoginStreak>,
  ) {}

  // ─── Calendar configuration ───────────────────────────────────────────────

  async createCalendar(dto: CreateCalendarDto): Promise<LoginRewardCalendar> {
    const maxDay = Math.max(0, ...dto.rewardDays.map((d) => d.day));
    if (maxDay > dto.cycleLength) {
      throw new BadRequestException(
        `rewardDays contains day ${maxDay} which exceeds cycleLength ${dto.cycleLength}`,
      );
    }

    const calendar = this.calendarRepo.create({
      name: dto.name,
      cycleLength: dto.cycleLength,
      resetOnMissDays: dto.resetOnMissDays ?? 1,
      rewardDays: dto.rewardDays,
      isActive: dto.isActive ?? true,
    });

    return this.calendarRepo.save(calendar);
  }

  async updateCalendar(
    calendarId: string,
    dto: UpdateCalendarDto,
  ): Promise<LoginRewardCalendar> {
    const calendar = await this.findCalendarOrThrow(calendarId);

    if (dto.cycleLength !== undefined) calendar.cycleLength = dto.cycleLength;
    if (dto.resetOnMissDays !== undefined)
      calendar.resetOnMissDays = dto.resetOnMissDays;
    if (dto.rewardDays !== undefined) calendar.rewardDays = dto.rewardDays;
    if (dto.isActive !== undefined) calendar.isActive = dto.isActive;

    return this.calendarRepo.save(calendar);
  }

  async findAllCalendars(): Promise<LoginRewardCalendar[]> {
    return this.calendarRepo.find({ order: { createdAt: 'ASC' } });
  }

  async findCalendarOrThrow(calendarId: string): Promise<LoginRewardCalendar> {
    const calendar = await this.calendarRepo.findOne({
      where: { id: calendarId },
    });
    if (!calendar) {
      throw new NotFoundException(
        `LoginRewardCalendar with id "${calendarId}" not found`,
      );
    }
    return calendar;
  }

  // ─── Player status ────────────────────────────────────────────────────────

  /**
   * Returns the player's current position in the reward calendar and whether
   * they have already claimed today's reward.
   */
  async getStatus(
    userId: string,
    calendarId: string,
    timezone = 'UTC',
  ): Promise<CalendarStatusResponse> {
    const calendar = await this.findCalendarOrThrow(calendarId);

    const streak = await this.getOrCreateStreak(userId, calendarId);
    const today = todayInTimezone(timezone);

    const alreadyClaimedToday = await this.hasClaimedToday(
      userId,
      calendarId,
      today,
    );

    // Determine the day number the player would claim next (after potential reset)
    const nextDayNumber = this.resolveNextDayNumber(streak, calendar, today);
    const nextRewardDay =
      calendar.rewardDays.find((r) => r.day === nextDayNumber) ?? null;

    return {
      calendarId: calendar.id,
      calendarName: calendar.name,
      cycleLength: calendar.cycleLength,
      currentDay: streak.currentDay,
      lastClaimDate: streak.lastClaimDate,
      todayDate: today,
      alreadyClaimedToday,
      nextReward: nextRewardDay,
    };
  }

  // ─── Claim ────────────────────────────────────────────────────────────────

  /**
   * Awards the daily login reward for today.
   *
   * Idempotent: calling this multiple times on the same calendar day returns
   * the same claim result with `alreadyClaimed: true` on subsequent calls.
   *
   * Timezone-safe: "today" is determined from the supplied IANA timezone string
   * so that a player logging in at 11 PM in their local timezone always receives
   * the correct day's reward, regardless of the server's clock timezone.
   */
  async claimDailyReward(
    userId: string,
    calendarId: string,
    dto: ClaimDailyRewardDto = {},
  ): Promise<ClaimRewardResponse> {
    const timezone = dto.timezone ?? 'UTC';

    // Validate timezone early – todayInTimezone falls back silently, but we
    // want to surface an invalid timezone to the caller.
    this.validateTimezone(timezone);

    const calendar = await this.findCalendarOrThrow(calendarId);

    if (!calendar.isActive) {
      throw new BadRequestException(
        `Calendar "${calendar.name}" is not currently active`,
      );
    }

    const today = todayInTimezone(timezone);

    // ── Idempotency check ────────────────────────────────────────────────
    const existingClaim = await this.claimRepo.findOne({
      where: { userId, calendarId, calendarDate: today },
    });

    if (existingClaim) {
      const streak = await this.getOrCreateStreak(userId, calendarId);
      return {
        success: true,
        alreadyClaimed: true,
        cycleReset: false,
        dayNumber: existingClaim.dayNumber,
        reward: existingClaim.rewardSnapshot,
        totalClaims: streak.totalClaims,
      };
    }

    // ── Streak & reset logic ─────────────────────────────────────────────
    let streak = await this.getOrCreateStreak(userId, calendarId);
    let cycleReset = false;

    if (streak.lastClaimDate !== null) {
      const daysSinceLast = daysBetween(streak.lastClaimDate, today);

      if (daysSinceLast === 0) {
        // Same day — already handled above; defensive guard
        throw new ConflictException('Already claimed today');
      }

      const missedDays = daysSinceLast - 1; // days skipped between last and today
      if (missedDays >= calendar.resetOnMissDays) {
        // Player missed enough days → reset cycle
        streak.currentDay = 1;
        cycleReset = true;
        this.logger.debug(
          `Cycle reset for user ${userId} on calendar ${calendarId}: missed ${missedDays} day(s)`,
        );
      } else {
        // Advance to next day in cycle
        streak.currentDay = (streak.currentDay % calendar.cycleLength) + 1;
      }
    }
    // else: first ever claim – stays at day 1

    const dayNumber = streak.currentDay;

    // ── Resolve reward ───────────────────────────────────────────────────
    const rewardDay = calendar.rewardDays.find((r) => r.day === dayNumber);
    const reward: Record<string, unknown> = rewardDay?.reward ?? {};

    // ── Persist claim (unique constraint guards concurrent requests) ──────
    const claim = this.claimRepo.create({
      userId,
      calendarId,
      calendarDate: today,
      dayNumber,
      rewardSnapshot: reward,
    });

    await this.claimRepo.save(claim);

    // ── Update streak ────────────────────────────────────────────────────
    streak.lastClaimDate = today;
    streak.totalClaims += 1;
    streak = await this.streakRepo.save(streak);

    this.logger.debug(
      `User ${userId} claimed day ${dayNumber} on calendar ${calendarId} (date: ${today})`,
    );

    return {
      success: true,
      alreadyClaimed: false,
      cycleReset,
      dayNumber,
      reward,
      totalClaims: streak.totalClaims,
    };
  }

  // ─── Claim history ────────────────────────────────────────────────────────

  async getClaimHistory(
    userId: string,
    calendarId: string,
  ): Promise<PlayerLoginRewardClaim[]> {
    return this.claimRepo.find({
      where: { userId, calendarId },
      order: { claimedAt: 'DESC' },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async getOrCreateStreak(
    userId: string,
    calendarId: string,
  ): Promise<PlayerLoginStreak> {
    let streak = await this.streakRepo.findOne({
      where: { userId, calendarId },
    });

    if (!streak) {
      streak = this.streakRepo.create({
        userId,
        calendarId,
        lastClaimDate: null,
        currentDay: 1,
        totalClaims: 0,
      });
      streak = await this.streakRepo.save(streak);
    }

    return streak;
  }

  private async hasClaimedToday(
    userId: string,
    calendarId: string,
    today: string,
  ): Promise<boolean> {
    const count = await this.claimRepo.count({
      where: { userId, calendarId, calendarDate: today },
    });
    return count > 0;
  }

  /**
   * Computes what day number the player WOULD receive if they claimed right now,
   * taking potential resets into account – used only for status display.
   */
  private resolveNextDayNumber(
    streak: PlayerLoginStreak,
    calendar: LoginRewardCalendar,
    today: string,
  ): number {
    if (streak.lastClaimDate === null) {
      return 1;
    }

    const daysSinceLast = daysBetween(streak.lastClaimDate, today);

    if (daysSinceLast === 0) {
      // Already claimed today – next would be day after
      return (streak.currentDay % calendar.cycleLength) + 1;
    }

    const missedDays = daysSinceLast - 1;
    if (missedDays >= calendar.resetOnMissDays) {
      return 1;
    }

    return (streak.currentDay % calendar.cycleLength) + 1;
  }

  private validateTimezone(timezone: string): void {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      throw new BadRequestException(
        `Invalid IANA timezone: "${timezone}". Use a valid timezone such as "UTC" or "America/New_York".`,
      );
    }
  }
}
