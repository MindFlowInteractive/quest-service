import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { MentorshipSession } from '../../sessions/entities/session.entity';
import { MentorshipMilestone } from '../../milestones/entities/milestone.entity';

export enum MentorshipStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('mentorships')
export class Mentorship {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mentorId: string;

  @Column()
  studentId: string;

  @Column({
    type: 'enum',
    enum: MentorshipStatus,
    default: MentorshipStatus.PENDING,
  })
  status: MentorshipStatus;

  @Column({ type: 'text', nullable: true })
  goal: string;

  @OneToMany(() => MentorshipSession, (session) => session.mentorship)
  sessions: MentorshipSession[];

  @OneToMany(() => MentorshipMilestone, (milestone) => milestone.mentorship)
  milestones: MentorshipMilestone[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}
