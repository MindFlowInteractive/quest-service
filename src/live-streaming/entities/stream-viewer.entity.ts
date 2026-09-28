import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { StreamQuality } from './live-stream.entity';

/**
 * One spectator's membership in a stream. Rows are kept after a viewer leaves
 * (`isActive = false`) so viewership can be analysed over time; `isActive`
 * scopes the live count.
 */
@Entity('stream_viewers')
@Index(['streamId', 'viewerId'])
@Index(['streamId', 'isActive'])
export class StreamViewer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  streamId: string;

  @Column({ type: 'varchar', length: 64 })
  viewerId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  username?: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: StreamQuality.MEDIUM,
  })
  quality: StreamQuality;

  @Column({ type: 'boolean', default: false })
  isModerator: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  joinedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
