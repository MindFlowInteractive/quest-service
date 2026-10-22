import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * One row per successful daily-login-reward claim.
 * The combination (userId, calendarDate) is unique to enforce one-claim-per-day.
 */
@Entity('player_login_reward_claims')
@Index(['userId', 'calendarDate'], { unique: true })
@Index(['userId', 'calendarId'])
export class PlayerLoginRewardClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'calendar_id', type: 'uuid' })
  calendarId: string;

  /**
   * The canonical calendar date on which this claim was made.
   * Stored as DATE (no time) in the player's resolved timezone so that
   * "today" is always unambiguous regardless of when the server clock is read.
   * Format: 'YYYY-MM-DD'
   */
  @Column({ name: 'calendar_date', type: 'date' })
  calendarDate: string;

  /** Which cycle day (1-based) was claimed */
  @Column({ name: 'day_number', type: 'int' })
  dayNumber: number;

  /** Snapshot of the reward that was granted */
  @Column({ name: 'reward_snapshot', type: 'jsonb', default: {} })
  rewardSnapshot: Record<string, unknown>;

  @CreateDateColumn({ name: 'claimed_at', type: 'timestamp with time zone' })
  claimedAt: Date;
}
