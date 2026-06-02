import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('mentor_ratings')
export class MentorRating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mentorId: string;

  @Column()
  studentId: string;

  @Column()
  mentorshipId: number;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
