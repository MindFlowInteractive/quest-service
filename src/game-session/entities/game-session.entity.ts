import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('game_sessions')
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: 'IN_PROGRESS' })
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

  @Column('jsonb', { default: {} })
  state: Record<string, any>; // Dynamic game state object

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  @Column({ type: 'int', default: 0 })
  totalMoves: number;

  @Column({ type: 'float', default: 0 })
  duration: number; // in minutes

  @Column('jsonb', { default: [] })
  replayLog: any[]; // Stores steps for replay

  @Column({ nullable: true })
  shareCode: string;

  @Column({ default: false })
  isSpectatorAllowed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
