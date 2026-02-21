import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity({ name: 'user_collection_progress' })
export class UserCollectionProgress {
  @PrimaryColumn('uuid')
  user_id: string;

  @PrimaryColumn('uuid')
  collection_id: string;

  @Index()
  @Column({ type: 'int', default: 0 })
  completed_puzzles_count: number;

  @Column({ type: 'int', default: 0 })
  total_puzzles: number;

  @Column({ type: 'numeric', default: 0 })
  progress_percentage: number;

  @Column({ type: 'boolean', default: false })
  is_completed: boolean;

  @Column({ type: 'datetime', nullable: true })
  completed_at?: Date;

  @Column({ type: 'boolean', default: false })
  reward_claimed: boolean;
}
