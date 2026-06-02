import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('mentorship_certificates')
export class MentorshipCertificate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mentorshipId: number;

  @Column()
  studentId: string;

  @Column()
  mentorId: string;

  @Column()
  certificateUrl: string;

  @Column()
  issuedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
