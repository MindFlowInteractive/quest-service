/**
 * Puzzle Editor Activity Entity
 * Tracks user activities in the editor for monitoring and analytics
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PuzzleEditor } from './puzzle-editor.entity';

@Entity('puzzle_editor_activities')
@Index(['puzzleEditorId', 'createdAt'])
@Index(['userId'])
@Index(['activityType'])
export class PuzzleEditorActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  puzzleEditorId: string;

  @Column({
    type: 'enum',
    enum: [
      'COMPONENT_CREATED',
      'COMPONENT_MODIFIED',
      'COMPONENT_DELETED',
      'PUZZLE_PUBLISHED',
      'PUZZLE_TESTED',
      'COLLABORATION_JOINED',
      'COLLABORATION_LEFT',
      'VERSION_CREATED',
      'SUBMISSION_CREATED',
      'COMMENT_ADDED',
      'TEMPLATE_USED',
      'VALIDATION_RUN',
    ],
  })
  activityType: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  details: Record<string, any>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    duration?: number;
  };

  // Relations
  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => PuzzleEditor, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzleEditorId' })
  puzzleEditor?: PuzzleEditor;
}
