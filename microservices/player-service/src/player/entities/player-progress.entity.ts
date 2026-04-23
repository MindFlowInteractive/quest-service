import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Player } from './player.entity';

export enum ProgressType {
  PUZZLE_COMPLETED = 'puzzle_completed',
  QUEST_COMPLETED = 'quest_completed',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEVEL_UP = 'level_up',
  SCORE_EARNED = 'score_earned',
}

@Entity('player_progress')
export class PlayerProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Player, (player) => player.progress, { onDelete: 'CASCADE' })
  @JoinColumn()
  player: Player;

  @Column({
    type: 'enum',
    enum: ProgressType,
  })
  type: ProgressType;

  @Column()
  referenceId: string; // ID of the related entity (puzzle, quest, etc.)

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ default: false })
  isProcessed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}