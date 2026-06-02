import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Mentorship } from '../../mentorships/entities/mentorship.entity';

@Entity('mentorship_sessions')
export class MentorshipSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Mentorship, (mentorship) => mentorship.sessions)
  mentorship: Mentorship;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  scheduledAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
