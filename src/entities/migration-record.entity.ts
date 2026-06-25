import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MigrationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

@Entity('global_migration_records')
export class MigrationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  version: string; // e.g., "20260625140000"

  @Column()
  name: string; // e.g., "AddVaultYieldTrackingColumns"

  @Column({ type: 'enum', enum: MigrationStatus, default: MigrationStatus.PENDING })
  status: MigrationStatus;

  @Column({ type: 'text', nullable: true })
  executionLog: string;

  @Column({ type: 'text', nullable: true })
  rollbackScript: string; // Dynamic backup fallback SQL string

  @Column({ type: 'int', default: 0 })
  executionTimeMs: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}