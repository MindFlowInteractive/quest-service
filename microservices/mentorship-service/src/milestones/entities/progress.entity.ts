import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { MentorshipMilestone } from './milestone.entity';

@Entity('milestone_progress')
export class MilestoneProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MentorshipMilestone, (milestone) => milestone.progressUpdates)
  milestone: MentorshipMilestone;

  @Column({ type: 'text' })
  updateMessage: string;

  @Column({ type: 'float', default: 0 })
  progressPercentage: number;

  @CreateDateColumn()
  createdAt: Date;
}
