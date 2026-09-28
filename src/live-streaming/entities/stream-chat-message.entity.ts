import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * A spectator chat message. Deletes are soft (`isDeleted`) so moderators can
 * remove content without losing the audit trail; `deletedBy` records who acted.
 */
@Entity('stream_chat_messages')
@Index(['streamId', 'createdAt'])
export class StreamChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  streamId: string;

  @Column({ type: 'varchar', length: 64 })
  authorId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'varchar', length: 64, nullable: true })
  deletedBy?: string;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
