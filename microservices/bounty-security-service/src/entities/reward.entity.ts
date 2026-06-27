import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RewardStatus } from './report-status.enum';
import { VulnerabilityReport } from './report.entity';
import { Researcher } from './researcher.entity';
import { Bounty } from './bounty.entity';

/**
 * A reward payment owed to a researcher for an accepted (FIXED) report.
 * Lifecycle: PENDING → APPROVED → PAID.
 */
@Entity('rewards')
@Index(['status'])
@Index(['researcherId'])
@Index(['bountyId'])
@Index(['reportId'], { unique: true })
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'report_id' })
  reportId: string;

  @ManyToOne(() => VulnerabilityReport, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: VulnerabilityReport;

  @Column({ type: 'uuid', name: 'researcher_id' })
  researcherId: string;

  @ManyToOne(() => Researcher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'researcher_id' })
  researcher: Researcher;

  @Column({ type: 'uuid', name: 'bounty_id' })
  bountyId: string;

  @ManyToOne(() => Bounty, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bounty_id' })
  bounty: Bounty;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 8 })
  currency: string;

  @Column({ type: 'enum', enum: RewardStatus, default: RewardStatus.PENDING })
  status: RewardStatus;

  /** Internal ledger / external payment-system reference once PAID. */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'transaction_ref' })
  transactionRef: string | null;

  /** Username of the operator who approved/paid the reward. */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'approved_by' })
  approvedBy: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'paid_at' })
  paidAt: Date | null;

  /** Free-form payout notes (e.g. "send via Tremendous 2026-06-15"). */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
