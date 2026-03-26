import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Puzzle } from './puzzle.entity';

/**
 * Immutable snapshot of a puzzle at a specific point in time.
 *
 * Rules:
 *  - One row is inserted BEFORE every PATCH /puzzles/:id update.
 *  - `version` is an integer auto-incremented per puzzle (1, 2, 3 …).
 *  - `content` holds the *full* JSONB snapshot of the puzzle at that version.
 *  - `diff` lists the field names whose values changed in this version.
 *  - Rows are never deleted or mutated — history is truly immutable.
 */
@Entity('puzzle_versions')
@Index(['puzzleId', 'version'], { unique: true })
@Index(['puzzleId', 'createdAt'])
@Index(['changedBy'])
export class PuzzleVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** FK → puzzles.id */
  @Column({ type: 'uuid', name: 'puzzle_id' })
  @Index()
  puzzleId: string;

  /** Monotonically-increasing version number scoped to one puzzle (1-based). */
  @Column({ type: 'integer', name: 'version' })
  version: number;

  /**
   * Full JSONB snapshot of the puzzle row *before* the edit that created
   * the *next* version — i.e. this is the content that was live at `version`.
   */
  @Column({ type: 'jsonb', name: 'content' })
  content: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    difficultyRating: number;
    basePoints: number;
    timeLimit: number;
    maxHints: number;
    content: any;
    hints: any[];
    tags: string[];
    prerequisites: string[];
    scoring: any;
    metadata: any;
    isActive: boolean;
    isFeatured: boolean;
    publishedAt: Date | null;
  };

  /** User ID of the editor who *applied the change that produced this version*. */
  @Column({ type: 'uuid', name: 'changed_by' })
  changedBy: string;

  /** Optional editor note describing what changed. */
  @Column({ type: 'text', name: 'change_note', nullable: true })
  changeNote?: string;

  /**
   * List of top-level field names that differ between this version and the
   * immediately preceding one.  Populated by the service; empty array for v1.
   */
  @Column({ type: 'jsonb', name: 'diff', default: [] })
  diff: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ── Relations ──────────────────────────────────────────────────────────────

  @ManyToOne(() => Puzzle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzle_id' })
  puzzle?: Puzzle;
}
