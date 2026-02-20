import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { QuestChainPuzzle } from './quest-chain-puzzle.entity';
import { UserQuestChainProgress } from './user-quest-chain-progress.entity';

export interface QuestChainStory {
  intro: string;
  outro: string;
  chapters: Array<{
    id: string;
    title: string;
    description: string;
    storyText: string;
  }>;
}

export interface QuestChainRewards {
  completion: {
    xp: number;
    coins: number;
    items: string[];
  };
  milestones: Array<{
    puzzleIndex: number;
    rewards: {
      xp: number;
      coins: number;
      items: string[];
    };
  }>;
}

@Entity('quest_chains')
@Index(['status', 'createdAt'])
export class QuestChain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  @Index()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  @Index()
  status: 'active' | 'inactive' | 'archived';

  @Column({ type: 'jsonb' })
  story: QuestChainStory;

  @Column({ type: 'jsonb', default: {} })
  rewards: QuestChainRewards;

  @Column({ type: 'int', default: 0 })
  @Index()
  completionCount: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  startsAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  endsAt?: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relationships
  @OneToMany(() => QuestChainPuzzle, chainPuzzle => chainPuzzle.questChain)
  chainPuzzles: QuestChainPuzzle[];

  @OneToMany(() => UserQuestChainProgress, progress => progress.questChain)
  userProgress: UserQuestChainProgress[];
}