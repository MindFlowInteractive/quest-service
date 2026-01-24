import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Replay } from './replay.entity';

export enum ActionType {
  MOVE = 'move',
  PLACE_PIECE = 'place_piece',
  REMOVE_PIECE = 'remove_piece',
  ROTATE = 'rotate',
  FLIP = 'flip',
  HINT_USED = 'hint_used',
  UNDO = 'undo',
  REDO = 'redo',
  PIECE_SELECTED = 'piece_selected',
  PIECE_DESELECTED = 'piece_deselected',
  CUSTOM = 'custom',
}

@Entity('actions')
@Index(['replayId', 'sequence'])
@Index(['timestamp'])
export class Action {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  replayId: string;

  @ManyToOne(() => Replay, (replay) => replay.actions, {
    onDelete: 'CASCADE',
  })
  replay: Replay;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  type: ActionType;

  @Column('jsonb')
  payload: Record<string, any>;

  @Column({ type: 'bigint' })
  timestamp: number; // Unix timestamp in ms

  @Column({ type: 'bigint' })
  relativeTime: number; // ms from replay start

  @Column({ type: 'integer' })
  sequence: number; // Action order in sequence

  @Column({ type: 'integer', nullable: true })
  userId?: number; // User who performed action

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>; // Additional context (mouse position, duration, etc.)

  @CreateDateColumn()
  createdAt: Date;
}
