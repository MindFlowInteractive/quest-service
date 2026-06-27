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
import {
  ReportStatus,
  SeverityTier,
  DisclosureType,
} from './report-status.enum';
import { Researcher } from './researcher.entity';
import { Bounty } from './bounty.entity';

/**
 * A vulnerability report submitted by a security researcher
 * against a scoped bounty program. Drives the entire workflow.
 */
@Entity('vulnerability_reports')
@Index(['status'])
@Index(['severity'])
@Index(['researcherId'])
@Index(['bountyId'])
@Index(['createdAt'])
export class VulnerabilityReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  /** Step-by-step reproduction instructions. */
  @Column({ type: 'text', name: 'steps_to_reproduce' })
  stepsToReproduce: string;

  /** System, service, or endpoint that is impacted. */
  @Column({ type: 'varchar', length: 255, name: 'affected_component' })
  affectedComponent: string;

  /**
   * Researcher-assessed severity (used as a hint by the severity engine).
   * May differ from `assessedSeverity` until triage completes.
   */
  @Column({ type: 'enum', enum: SeverityTier })
  severity: SeverityTier;

  /**
   * Severity computed by the severity assessment engine after triage.
   * Null until the report enters the TRIAGED status.
   */
  @Column({
    type: 'enum',
    enum: SeverityTier,
    nullable: true,
    name: 'assessed_severity',
  })
  assessedSeverity: SeverityTier | null;

  /** Calculated CVSS v3.1 base score, if provided by the researcher or scan. */
  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
    name: 'cvss_score',
  })
  cvssScore: number | null;

  /** Vector string for CVSS (e.g. "CVSS:3.1/AV:N/AC:L/..."). */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cvss_vector' })
  cvssVector: string | null;

  @Column({ type: 'enum', enum: DisclosureType, default: DisclosureType.PRIVATE })
  disclosure: DisclosureType;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.NEW })
  status: ReportStatus;

  /**
   * JSON document capturing the severity engine's reasoning:
   * impact subscore, exploitability subscore, multipliers, etc.
   */
  @Column({ type: 'jsonb', nullable: true, name: 'severity_rationale' })
  severityRationale: Record<string, any> | null;

  /** Internal log of workflow transitions (audit trail). */
  @Column({ type: 'jsonb', default: [] })
  transitions: Array<{
    from: ReportStatus;
    to: ReportStatus;
    by: string;
    note?: string;
    at: Date;
  }>;

  /**
   * Set once after reputation/penalty has been applied for this report.
   * Prevents double-counting on reopens and on the New→Verified→Fixed walk.
   */
  @Column({ type: 'timestamp', nullable: true, name: 'reputation_credited_at' })
  reputationCreditedAt: Date | null;

  /** References to attached PoC files (URLs or storage keys). */
  @Column({ type: 'jsonb', default: [] })
  attachments: Array<{ name: string; url: string; size?: number; mime?: string }>;

  @Column({ type: 'uuid', name: 'researcher_id' })
  researcherId: string;

  @ManyToOne(() => Researcher, (r) => r.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'researcher_id' })
  researcher: Researcher;

  @Column({ type: 'uuid', nullable: true, name: 'bounty_id' })
  bountyId: string | null;

  @ManyToOne(() => Bounty, (b) => b.reports, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bounty_id' })
  bounty: Bounty | null;

  /** Username of the security engineer who triaged/verified; null if unset. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  triagedBy: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'triaged_at' })
  triagedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'verified_at' })
  verifiedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'fixed_at' })
  fixedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
