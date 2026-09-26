import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AppealStatus } from '../enums/moderation.enums';

@Entity('moderation_appeals')
@Index(['flagId'])
@Index(['userId'])
@Index(['status'])
export class ModerationAppeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  flagId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'enum', enum: AppealStatus, default: AppealStatus.PENDING })
  status: AppealStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewerId: string;

  @Column({ type: 'text', nullable: true })
  reviewerDecision: string;

  @Column({ type: 'text', nullable: true })
  reviewerNotes: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
