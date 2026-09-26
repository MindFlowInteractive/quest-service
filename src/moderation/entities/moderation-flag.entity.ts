import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  ContentType,
  ModerationStatus,
  ViolationCategory,
  Severity,
} from '../enums/moderation.enums';

@Entity('moderation_flags')
@Index(['contentType', 'contentId'])
@Index(['status'])
@Index(['userId'])
export class ModerationFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: ContentType })
  contentType: ContentType;

  @Column({ type: 'uuid' })
  contentId: string;

  @Column({ type: 'text', nullable: true })
  contentSnapshot: string;

  @Column({
    type: 'enum',
    enum: ModerationStatus,
    default: ModerationStatus.PENDING,
  })
  status: ModerationStatus;

  @Column({
    type: 'enum',
    enum: ViolationCategory,
    default: ViolationCategory.NONE,
  })
  category: ViolationCategory;

  @Column({ type: 'enum', enum: Severity, default: Severity.LOW })
  severity: Severity;

  @Column({ type: 'float', default: 0 })
  toxicityScore: number;

  @Column({ type: 'jsonb', nullable: true })
  mlClassification: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  flagReason: string;

  @Column({ type: 'uuid', nullable: true })
  reviewerId: string;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'boolean', default: false })
  isAutoModerated: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
