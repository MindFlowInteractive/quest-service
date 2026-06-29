import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BackupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  SNAPSHOT = 'snapshot',
}

export enum RestoreStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('backups')
export class Backup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: BackupType,
    default: BackupType.SNAPSHOT,
  })
  backupType: BackupType;

  @Column({
    type: 'enum',
    enum: BackupStatus,
    default: BackupStatus.PENDING,
  })
  status: BackupStatus;

  @Column({ nullable: true })
  storagePath: string;

  @Column({ type: 'bigint', nullable: true })
  sizeBytes: number;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('backup_schedules')
export class BackupSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  cronExpression: string;

  @Column({
    type: 'enum',
    enum: BackupType,
    default: BackupType.INCREMENTAL,
  })
  backupType: BackupType;

  @Column({ type: 'int', default: 7 })
  retentionDays: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastRunAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextRunAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('restore_requests')
export class RestoreRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  backupId: string;

  @Column()
  requestedBy: string;

  @Column({
    type: 'enum',
    enum: RestoreStatus,
    default: RestoreStatus.PENDING,
  })
  status: RestoreStatus;

  @Column({ nullable: true })
  targetEnvironment: string;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}