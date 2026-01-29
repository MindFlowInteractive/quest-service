import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

@Entity('puzzle_categories')
@Index(['slug'], { unique: true })
export class PuzzleCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  iconUrl?: string;

  @Column({ type: 'varchar', length: 7, default: '#000000' })
  color: string; // Hex color code

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  @Index()
  sortOrder: number;

  @Column({ type: 'int', default: 0 })
  @Index()
  puzzleCount: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    skills?: string[]; // Skills developed by this category
    ageRange?: {
      min: number;
      max: number;
    };
    estimatedTimePerPuzzle?: number; // average minutes
    difficultyDistribution?: {
      easy: number;
      medium: number;
      hard: number;
      expert: number;
    };
    tags?: string[];
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;
}
