import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('mentor_profiles')
export class MentorProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: string;

  @Column('simple-array', { nullable: true })
  specialties: string[];

  @Column({ type: 'float', default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalStudentsHandled: number;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
