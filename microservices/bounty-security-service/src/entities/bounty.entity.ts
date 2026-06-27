import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { BountyStatus, SeverityTier } from './report-status.enum';
import { VulnerabilityReport } from './report.entity';
import { Researcher } from './researcher.entity';

/**
 * Reward configuration for a single severity tier within a bounty.
 * Stored nested inside the bounty row for atomic reads.
 */
export interface RewardTier {
  severity: SeverityTier;
  minAmount: number;
  maxAmount: number;
  currency: string;
}

/**
 * A bug-bounty program: scopes what researchers can report on,
 * defines reward tiers for each severity, and tracks lifecycle.
 */
@Entity('bounties')
@Index(['status'])
@Index(['slug'], { unique: true })
export class Bounty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** URL-safe identifier (e.g. "main-app-q3-2026"). */
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  /**
   * Free-form list of in-scope components, hostnames, or endpoints.
   * Researchers reporting against items not in this list may be rejected.
   */
  @Column({ type: 'jsonb', default: [] })
  scope: Array<{ type: string; target: string }>;

  /** Out-of-scope items (for transparency and faster rejection rationale). */
  @Column({ type: 'jsonb', default: [], name: 'out_of_scope' })
  outOfScope: string[];

  /**
   * Reward tiers in increasing severity.
   * If omitted, the global defaults from env are applied.
   */
  @Column({ type: 'jsonb', default: [] })
  tiers: RewardTier[];

  /** Default reporting currency if no tier matches. */
  @Column({ type: 'varchar', length: 8, default: 'USD' })
  currency: string;

  @Column({ type: 'enum', enum: BountyStatus, default: BountyStatus.DRAFT })
  status: BountyStatus;

  /** Total pooled budget (null = uncapped). */
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true, name: 'budget_cap' })
  budgetCap: number | null;

  /** Amount already paid out across all accepted reports. */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'paid_out' })
  paidOut: number;

  /** Owner / sponsor of the bounty (team or company). */
  @Column({ type: 'varchar', length: 255, name: 'created_by' })
  createdBy: string;

  @Column({ type: 'timestamp', nullable: true, name: 'opens_at' })
  opensAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'closes_at' })
  closesAt: Date | null;

  @OneToMany(() => VulnerabilityReport, (r) => r.bounty)
  reports: VulnerabilityReport[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
