// difficulty-feedback.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn } from 'typeorm';

@Entity('difficulty_feedback')
@Unique(['puzzleId', 'playerId'])
export class DifficultyFeedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  puzzleId: string;

  @Column()
  playerId: string;

  @Column({ type: 'enum', enum: ['too_easy', 'just_right', 'too_hard'] })
  rating: 'too_easy' | 'just_right' | 'too_hard';

  @CreateDateColumn()
  submittedAt: Date;
}
