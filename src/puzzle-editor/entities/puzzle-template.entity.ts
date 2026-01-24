/**
 * Puzzle Template Entity
 * Pre-built puzzle patterns for quick creation
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('puzzle_templates')
@Index(['puzzleType', 'difficulty'])
@Index(['category'])
@Index(['createdBy'])
export class PuzzleTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50 })
  puzzleType: string; // LOGIC_GRID, SEQUENCE, SPATIAL, etc.

  @Column({ type: 'varchar', length: 50 })
  difficulty: string; // EASY, MEDIUM, HARD, EXPERT

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'jsonb' })
  baseState: any; // Base EditorState template

  @Column({ type: 'jsonb', default: () => "'[]'" })
  requiredComponents: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  suggestedComponents: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  constraints: any[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  examplePuzzles: string[];

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'integer', default: 0 })
  usageCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  thumbnail?: string; // Base64 or image URL

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: {
    targetAudience?: string;
    estimatedCreationTime?: number;
    requiredSkills?: string[];
    commonMistakes?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { eager: false, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: User;
}
