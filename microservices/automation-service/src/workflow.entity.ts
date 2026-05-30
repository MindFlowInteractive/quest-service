import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', default: {} })
  definition: Record<string, unknown>;

  @Column({ type: 'enum', enum: WorkflowStatus, default: WorkflowStatus.PENDING })
  status: WorkflowStatus;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  scheduledAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}