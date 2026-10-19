import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { PuzzlePlayerStatus } from '../enums/puzzle-player-status.enum';
import { PuzzlePlayerRole } from '../enums/puzzle-player-role.enum';

@Entity('puzzle_session_players')
@Index(['sessionId', 'userId'], { unique: true })
export class PuzzleSessionPlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'user_id', length: 128 })
  userId: string;

  @Column({
    type: 'enum',
    enum: PuzzlePlayerStatus,
    default: PuzzlePlayerStatus.CONNECTED,
  })
  status: PuzzlePlayerStatus;

  @Column({
    type: 'enum',
    enum: PuzzlePlayerRole,
    default: PuzzlePlayerRole.CONTRIBUTOR,
  })
  role: PuzzlePlayerRole;

  @Column({ name: 'score', default: 0 })
  score: number;

  @Column({ name: 'progress', type: 'float', default: 0 })
  progress: number;

  @Column({ name: 'contributions', default: 0 })
  contributions: number;

  @Column({ name: 'contribution_points', default: 0 })
  contributionPoints: number;

  @Column({
    name: 'last_contribution_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastContributionAt: Date | null;

  @Column({
    name: 'joined_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  joinedAt: Date;

  @Column({
    name: 'last_seen_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastSeenAt: Date;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  leftAt: Date | null;
}
