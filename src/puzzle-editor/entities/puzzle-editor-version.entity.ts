/**
 * Puzzle Editor Version Entity
 * Tracks version history and revisions of puzzle editors
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

@Entity('puzzle_editor_versions')
@Index(['puzzleEditorId', 'versionNumber'])
@Index(['createdBy'])
@Index(['createdAt'])
export class PuzzleEditorVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  puzzleEditorId: string;

  @Column({ type: 'integer' })
  versionNumber: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  versionTag?: string;

  @Column({ type: 'jsonb' })
  state: any; // EditorState snapshot

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: {
    changesSummary: string;
    affectedComponents: string[];
    testResults?: any[];
    approvedBy?: string;
    approvedAt?: Date;
    tags: string[];
    estimatedDifficulty?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => PuzzleEditor, (editor) => editor.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'puzzleEditorId' })
  editor?: PuzzleEditor;

  @ManyToOne(() => User, { eager: false, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: User;
}
