import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ABTestStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'ab_tests' })
export class ABTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ABTestStatus,
    default: ABTestStatus.DRAFT,
  })
  status: ABTestStatus;

  @Column({ type: 'jsonb' })
  variantA: Record<string, any>;

  @Column({ type: 'jsonb' })
  variantB: Record<string, any>;

  @Column({ type: 'int', default: 50 })
  splitPercentage: number;

  @Column({ nullable: true })
  segmentId: string;

  @Column({ nullable: true })
  winnerId: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
