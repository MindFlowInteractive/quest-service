import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum ReportTargetType {
  PUZZLE = 'puzzle',
  PLAYER = 'player',
  CHAT_MESSAGE = 'chat_message'
}

export enum ReportStatus {
  OPEN = 'open',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved'
}

export enum ReportPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('content_reports')
@Index(['targetType', 'targetId'])
@Index(['status'])
@Index(['priority'])
@Index(['createdAt'])
export class ContentReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  reporter: User;

  @Column()
  reporterId: string;

  @Column({
    type: 'enum',
    enum: ReportTargetType
  })
  targetType: ReportTargetType;

  @Column()
  targetId: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: ReportPriority,
    default: ReportPriority.LOW
  })
  priority: ReportPriority;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.OPEN
  })
  status: ReportStatus;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  resolvedAt?: Date;

  @Column({ nullable: true })
  resolvedBy?: string;
}
