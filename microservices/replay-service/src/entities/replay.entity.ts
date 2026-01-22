import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

@Entity('replays')
export class Replay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  puzzleId: string;

  @Column()
  playerId: string;

  @Column('jsonb')
  initialState: any;

  @Column('jsonb', { default: [] })
  moves: ReplayMove[];

  @Column('jsonb', { default: [] })
  snapshots: ReplaySnapshot[];

  @Column('jsonb', { default: {} })
  metadata: {
    defaultSpeed?: number;
    lastViewedPosition?: number;
    completed?: boolean;
    totalDuration?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
