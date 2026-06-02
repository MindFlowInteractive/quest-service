import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Mentorship } from '../../mentorships/entities/mentorship.entity';
import { MilestoneProgress } from './progress.entity';

@Entity('mentorship_milestones')
export class MentorshipMilestone {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Mentorship, (mentorship) => mentorship.milestones)
  mentorship: Mentorship;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'int', default: 100 })
  rewardAmount: number;

  @OneToMany(() => MilestoneProgress, (progress) => progress.milestone)
  progressUpdates: MilestoneProgress[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
