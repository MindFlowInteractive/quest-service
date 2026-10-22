import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Shared sub-DTOs ────────────────────────────────────────────────────────

export class RewardDayDto {
  @IsInt()
  @Min(1)
  day: number;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsObject()
  reward: Record<string, unknown>;
}

// ─── Calendar management ────────────────────────────────────────────────────

export class CreateCalendarDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  @Max(365)
  cycleLength: number;

  /**
   * How many consecutive missed days trigger a cycle reset.
   * Default 1 = any missed day resets the cycle.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  resetOnMissDays?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardDayDto)
  rewardDays: RewardDayDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCalendarDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  cycleLength?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  resetOnMissDays?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardDayDto)
  rewardDays?: RewardDayDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── Claim ──────────────────────────────────────────────────────────────────

export class ClaimDailyRewardDto {
  /**
   * IANA timezone string (e.g. "America/New_York").
   * Defaults to "UTC" when omitted.
   * Used to determine which calendar day "today" maps to for the player.
   */
  @IsOptional()
  @IsString()
  timezone?: string;
}

// ─── Response shapes (plain objects, no class-validator needed) ─────────────

export interface CalendarStatusResponse {
  calendarId: string;
  calendarName: string;
  cycleLength: number;
  currentDay: number;
  lastClaimDate: string | null;
  todayDate: string;
  alreadyClaimedToday: boolean;
  nextReward: RewardDayDto | null;
}

export interface ClaimRewardResponse {
  success: boolean;
  /** True when the player had already claimed today (idempotent) */
  alreadyClaimed: boolean;
  /** True when missed days caused a cycle reset before this claim */
  cycleReset: boolean;
  dayNumber: number;
  reward: Record<string, unknown>;
  totalClaims: number;
}
