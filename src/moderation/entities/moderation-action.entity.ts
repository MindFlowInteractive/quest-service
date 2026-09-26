import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ActionType, Severity } from '../enums/moderation.enums';

@Entity('moderation_actions')
@Index(['userId'])
@Index(['flagId'])
export class ModerationAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  flagId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: ActionType })
  actionType: ActionType;

  @Column({ type: 'enum', enum: Severity })
  severity: Severity;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'uuid', nullable: true })
  issuedById: string;

  @Column({ type: 'boolean', default: false })
  isAutomatic: boolean;

  @Column({ type: 'boolean', default: false })
  reverted: boolean;

  @Column({ type: 'uuid', nullable: true })
  revertedById: string;

  @Column({ type: 'timestamp', nullable: true })
  revertedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
