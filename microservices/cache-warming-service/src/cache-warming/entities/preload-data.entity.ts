import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PreloadSourceType {
  PUZZLE = 'puzzle',
  LEADERBOARD = 'leaderboard',
  ACHIEVEMENT = 'achievement',
  PLAYER_PROFILE = 'player_profile',
  CONFIG = 'config',
  BLOCKCHAIN = 'blockchain',
  CUSTOM = 'custom',
}

export enum WarmWindow {
  ALWAYS = 'always',
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night',
}

@Entity('preload_data')
export class PreloadData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 240 })
  cacheKey: string;

  @Column({
    type: 'enum',
    enum: PreloadSourceType,
    default: PreloadSourceType.CUSTOM,
  })
  sourceType: PreloadSourceType;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fetchUrl: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  accessCount: number;

  @Column({ type: 'int', default: 0 })
  hitCount: number;

  @Column({ type: 'int', default: 0 })
  missCount: number;

  @Column({ type: 'float', default: 0 })
  popularityScore: number;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'int', default: 3600 })
  ttlSeconds: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: WarmWindow, default: WarmWindow.ALWAYS })
  warmWindow: WarmWindow;

  @Column({ type: 'timestamptz', nullable: true })
  lastAccessedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastWarmedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'int', nullable: true })
  invalidationIntervalSeconds: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  nextInvalidationAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
