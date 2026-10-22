import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface RewardDay {
  /** 1-based day number within the calendar cycle */
  day: number;
  /** Human-readable label, e.g. "Day 7 Bonus" */
  label: string;
  /** Arbitrary reward payload – coins, items, XP, etc. */
  reward: Record<string, unknown>;
}

@Entity('login_reward_calendars')
export class LoginRewardCalendar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Unique name / slug for this calendar configuration (e.g. "default", "vip") */
  @Column({ type: 'varchar', length: 128, unique: true })
  name: string;

  /** Total days in one complete cycle (e.g. 28 for a 4-week calendar) */
  @Column({ name: 'cycle_length', type: 'int', default: 28 })
  cycleLength: number;

  /**
   * Number of consecutive days a player must miss before the streak is reset
   * back to day 1.  A value of 1 means any single missed calendar day resets.
   */
  @Column({ name: 'reset_on_miss_days', type: 'int', default: 1 })
  resetOnMissDays: number;

  /** Ordered array describing the reward offered on each day of the cycle */
  @Column({ name: 'reward_days', type: 'jsonb', default: [] })
  rewardDays: RewardDay[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
