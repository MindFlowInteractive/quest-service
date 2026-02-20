import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuestChain } from './quest-chain.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

export interface UnlockConditions {
  previousPuzzles: string[]; // IDs of puzzles that must be completed
  minimumScore?: number;
  timeLimit?: number;
  noHints?: boolean;
}

export interface BranchCondition {
  conditionType: 'score' | 'time' | 'accuracy' | 'custom';
  operator: 'gte' | 'lte' | 'equals' | 'between';
  value: number | [number, number];
  nextPuzzleId: string; // ID of next puzzle in branch path
}

export interface CheckpointRewards {
  xp: number;
  coins: number;
  items: string[];
}

@Entity('quest_chain_puzzles')
@Index(['questChainId', 'sequenceOrder'])
export class QuestChainPuzzle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  questChainId: string;

  @Column({ type: 'uuid' })
  @Index()
  puzzleId: string;

  @Column({ type: 'int' })
  @Index()
  sequenceOrder: number;

  @Column({ type: 'jsonb', default: {} })
  unlockConditions: UnlockConditions;

  @Column({ type: 'jsonb', default: [] })
  branchConditions: BranchCondition[];

  @Column({ type: 'boolean', default: false })
  isCheckpoint: boolean;

  @Column({ type: 'jsonb', default: {} })
  checkpointRewards: CheckpointRewards;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => QuestChain, chain => chain.chainPuzzles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questChainId' })
  questChain: QuestChain;

  @ManyToOne(() => Puzzle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: Puzzle;
}