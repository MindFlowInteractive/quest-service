import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Action } from './action.entity';

export interface ReplayMove {
  moveData: any;
  timestamp: Date;
  relativeTime: number; // ms from start
}

export interface ReplaySnapshot {
  step: number;
  state: any;
  timestamp: Date;
}

export enum PrivacyLevel {
  PRIVATE = 'private', // Only owner can view
  SHARED = 'shared', // Only shared users can view
  PUBLIC = 'public', // Everyone can view
  UNLISTED = 'unlisted', // Anyone with link can view
}

@Entity('replays')
@Index(['playerId'])
@Index(['puzzleId'])
@Index(['privacyLevel'])
@Index(['createdAt'])
export class Replay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  puzzleId: number;

  @Column({ type: 'integer' })
  playerId: number;

  @Column({ type: 'varchar', default: '' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('jsonb')
  initialState: any;

  @Column('jsonb', { default: [] })
  moves: ReplayMove[];

  @Column('jsonb', { default: [] })
  snapshots: ReplaySnapshot[];

  @Column({
    type: 'enum',
    enum: PrivacyLevel,
    default: PrivacyLevel.PRIVATE,
  })
  privacyLevel: PrivacyLevel;

  @Column('simple-array', { default: '' })
  sharedWith: number[] = []; // Array of user IDs

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'varchar', nullable: true })
  shareToken?: string; // Token for unlisted/public sharing

  @Column('jsonb', { default: {} })
  metadata: {
    defaultSpeed?: number;
    lastViewedPosition?: number;
    completed?: boolean;
    totalDuration?: number;
    viewCount?: number;
    likes?: number;
    tags?: string[];
    difficulty?: string;
    timeToComplete?: number;
  };

  @OneToMany(() => Action, (action) => action.replay, {
    cascade: true,
    eager: false,
  })
  actions: Action[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
