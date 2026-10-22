import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Tracks where a player is in the reward calendar cycle.
 * One row per (userId, calendarId) pair.
 */
@Entity('player_login_streaks')
@Index(['userId', 'calendarId'], { unique: true })
export class PlayerLoginStreak {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'calendar_id', type: 'uuid' })
  calendarId: string;

  /**
   * The last calendar date the player successfully claimed a reward.
   * Format: 'YYYY-MM-DD'  (null = never claimed)
   */
  @Column({ name: 'last_claim_date', type: 'date', nullable: true })
  lastClaimDate: string | null;

  /** Current position in the cycle (1-based). Resets to 1 after a missed day. */
  @Column({ name: 'current_day', type: 'int', default: 1 })
  currentDay: number;

  /** How many total days this player has claimed in this calendar ever */
  @Column({ name: 'total_claims', type: 'int', default: 0 })
  totalClaims: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
