import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('player_events')
@Index(['playerId', 'timestamp'])
@Index(['type', 'timestamp'])
export class PlayerEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  playerId: string;

  @Column()
  @Index()
  sessionId: string;

  @Column()
  type: string; // login, logout, puzzle_start, puzzle_complete, etc.

  @Column({ type: 'int', nullable: true })
  sessionDuration: number; // in seconds

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  devicePlatform: string;

  @Column({ nullable: true })
  deviceVersion: string;

  @Column({ nullable: true })
  country: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  timestamp: Date;