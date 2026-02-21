import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'user_puzzle_completion' })
export class UserPuzzleCompletion {
  @PrimaryColumn('uuid')
  user_id: string;

  @PrimaryColumn('uuid')
  puzzle_id: string;

  @Column({ type: 'datetime', default: () => "(datetime('now'))" })
  completed_at: Date;
}
