/**
 * Puzzle Editor Entity
 * Represents a puzzle editor session/draft
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { PuzzleTemplate } from './puzzle-template.entity';
import { PuzzleEditorVersion } from './puzzle-editor-version.entity';
import { CommunitySubmission } from './community-submission.entity';

@Entity('puzzle_editors')
@Index(['createdBy', 'status'])
@Index(['puzzleId'])
@Index(['templateId'])
export class PuzzleEditor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  puzzleId?: string;

  @Column({ nullable: true })
  templateId?: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['DRAFT', 'IN_PROGRESS', 'TESTING', 'READY_FOR_PUBLICATION', 'PUBLISHED'],
    default: 'DRAFT',
  })
  status: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  lastModifiedBy?: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  components: any[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  connections: any[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  editorMetadata: Record<string, any>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: {
    version: string;
    puzzleType: string;
    difficulty: string;
    category: string;
    tags: string[];
    isPublic: boolean;
    isCollaborative: boolean;
    collaborators?: string[];
    viewCount: number;
    testCount: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator?: User;

  @ManyToOne(() => Puzzle, { eager: false, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'puzzleId' })
  puzzle?: Puzzle;

  @ManyToOne(() => PuzzleTemplate, { eager: false, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'templateId' })
  template?: PuzzleTemplate;

  @OneToMany(() => PuzzleEditorVersion, (version) => version.editor, {
    cascade: true,
    eager: false,
  })
  versions?: PuzzleEditorVersion[];

  @OneToMany(() => CommunitySubmission, (submission) => submission.puzzleEditor, {
    cascade: true,
    eager: false,
  })
  submissions?: CommunitySubmission[];

  @ManyToMany(() => User, { eager: false })
  @JoinTable({
    name: 'puzzle_editor_collaborators',
    joinColumn: { name: 'puzzleEditorId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  collaborators?: User[];
}
