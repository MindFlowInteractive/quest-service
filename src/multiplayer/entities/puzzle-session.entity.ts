import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PuzzleSessionStatus } from '../enums/puzzle-session-status.enum';

@Entity('puzzle_sessions')
export class PuzzleSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'puzzle_id', length: 128 })
  puzzleId: string;

  @Column({
    type: 'enum',
    enum: PuzzleSessionStatus,
    default: PuzzleSessionStatus.WAITING,
  })
  status: PuzzleSessionStatus;

  @Column({ name: 'max_players', default: 10 })
  maxPlayers: number;

  /**
   * Steps that must be solved for the team to win. When empty the session is
   * completed manually (legacy behaviour).
   */
  @Column({ name: 'required_solved_steps', type: 'jsonb', default: () => "'[]'" })
  requiredSolvedSteps: string[];

  /**
   * Minimum number of distinct players that must contribute to the required
   * steps before the team can win.
   */
  @Column({ name: 'min_contributors', default: 1 })
  minContributors: number;

  /**
   * When true, every connected player must contribute at least once.
   */
  @Column({ name: 'require_all_players', default: false })
  requireAllPlayers: boolean;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
