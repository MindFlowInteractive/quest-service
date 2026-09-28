import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ModerationActionType {
  BAN = 'ban',
  UNBAN = 'unban',
  TIMEOUT = 'timeout',
  DELETE_MESSAGE = 'delete_message',
  CLEAR_CHAT = 'clear_chat',
  PIN_MESSAGE = 'pin_message',
}

/**
 * An immutable moderator decision. Enforcement reads these rows (an active ban
 * or an unexpired timeout), so the decision and the audit record are the same
 * thing.
 */
@Entity('stream_moderation_actions')
@Index(['streamId', 'targetUserId'])
export class StreamModerationAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  streamId: string;

  @Column({ type: 'varchar', length: 64 })
  moderatorId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  targetUserId?: string;

  @Column({ type: 'varchar', length: 20 })
  action: ModerationActionType;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reason?: string;

  @Column({ type: 'uuid', nullable: true })
  messageId?: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
