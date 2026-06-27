import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { VulnerabilityReport } from './report.entity';
import { Reward } from './reward.entity';

/**
 * A security researcher who can submit vulnerability reports
 * and earn reputation + rewards.
 */
@Entity('researchers')
@Index(['handle'], { unique: true })
@Index(['reputation'])
export class Researcher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Public handle, display-only. */
  @Column({ type: 'varchar', length: 100 })
  handle: string;

  /** Optional email used for reward delivery (encrypted at rest in prod). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'display_name' })
  displayName: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  /** Public profile URL (personal site or social handle page). */
  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string | null;

  // ── Reputation snapshot ─────────────────────────────────────────────────
  /** Aggregate reputation score (sum of weighted accepted reports). */
  @Column({ type: 'int', default: 0 })
  reputation: number;

  /** Lifetime accepts (only TRIAGED+VERIFIED+FIXED). */
  @Column({ type: 'int', default: 0, name: 'accepted_reports' })
  acceptedReports: number;

  /** Lifetime submissions. */
  @Column({ type: 'int', default: 0, name: 'total_reports' })
  totalReports: number;

  /** Lifetime rejection count (drives `streak` reset on rejections). */
  @Column({ type: 'int', default: 0, name: 'rejected_reports' })
  rejectedReports: number;

  /** Sum of reward amounts paid to this researcher (in their primary currency). */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'total_earned' })
  totalEarned: number;

  /** Streak: number of consecutive accepts since the last rejection. */
  @Column({ type: 'int', default: 0 })
  streak: number;

  /** Optional rank/level: bronze, silver, gold, platinum, diamond. */
  @Column({ type: 'varchar', length: 16, default: 'bronze' })
  rank: string;

  @OneToMany(() => VulnerabilityReport, (r) => r.researcher)
  reports: VulnerabilityReport[];

  @OneToMany(() => Reward, (r) => r.researcher)
  rewards: Reward[];

  /** Flagged inactive if true — submissions from this handle are auto-rejected. */
  @Column({ type: 'boolean', default: false, name: 'is_blocked' })
  isBlocked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
