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
import { User } from '../../users/entities/user.entity';

export interface CheckpointData {
  [puzzleId: string]: {
    completedAt: Date;
    score: number;
    timeTaken: number;
    hintsUsed: number;
  };
}

export interface BranchPath {
  [decisionPoint: string]: string; // puzzleId -> chosenBranchPuzzleId
}

@Entity('user_quest_chain_progress')
@Index(['userId', 'questChainId'])
@Index(['userId', 'status'])
export class UserQuestChainProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  questChainId: string;

  @Column({ type: 'varchar', length: 50, default: 'not_started' })
  @Index()
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';

  @Column({ type: 'int', default: 0 })
  currentPuzzleIndex: number;

  @Column({ type: 'simple-array', default: '' })
  completedPuzzleIds: string[];

  @Column({ type: 'jsonb', default: {} })
  checkpointData: CheckpointData;

  @Column({ type: 'jsonb', default: {} })
  branchPath: BranchPath;

  @Column({ type: 'int', default: 0 })
  totalScore: number;

  @Column({ type: 'int', default: 0 })
  totalTime: number; // seconds

  @Column({ type: 'int', default: 0 })
  totalHintsUsed: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastPlayedAt?: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => QuestChain, chain => chain.userProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questChainId' })
  questChain: QuestChain;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}