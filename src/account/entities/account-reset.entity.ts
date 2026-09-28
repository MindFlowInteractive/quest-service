import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ResetType {
  FULL_PROGRESSION = 'full_progression',
  XP_ONLY = 'xp_only',
  INVENTORY_ONLY = 'inventory_only',
  BATTLE_PASS_ONLY = 'battle_pass_only',
}

export enum ResetStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AccountAuditAction {
  RESET_REQUESTED = 'reset_requested',
  RESET_CONFIRMED = 'reset_confirmed',
  RESET_COMPLETED = 'reset_completed',
  RESET_CANCELLED = 'reset_cancelled',
  ACCOUNT_LINKED = 'account_linked',
  ACCOUNT_UNLINKED = 'account_unlinked',
  DELETION_REQUESTED = 'deletion_requested',
  BACKUP_CREATED = 'backup_created',
}

@Entity('account_resets')
@Index(['userId'])
@Index(['status'])
export class AccountReset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'enum', enum: ResetType, default: ResetType.FULL_PROGRESSION })
  resetType: ResetType;

  @Column({ type: 'enum', enum: ResetStatus, default: ResetStatus.PENDING })
  status: ResetStatus;

  @Column({ type: 'varchar', length: 64, nullable: true })
  confirmationToken?: string;

  @Column({ type: 'jsonb', nullable: true })
  backupSnapshot?: Record<string, any>; // Snapshot of data before reset

  @Column({ type: 'timestamp with time zone', nullable: true })
  confirmedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  createdAt: Date;
}
