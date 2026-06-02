import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('mentor_rewards')
export class MentorReward {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mentorId: string;

  @Column()
  mentorshipId: number;

  @Column({ type: 'int' })
  amount: number;

  @Column()
  reason: string; // e.g., "Milestone Completed", "Mentorship Completed"

  @CreateDateColumn()
  createdAt: Date;
}
