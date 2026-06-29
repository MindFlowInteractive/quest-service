import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('leaderboards')
export class Leaderboard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  category: string;

  @Column({ length: 50 })
  period: string; // e.g., daily, weekly, all-time

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 20, default: 'public' })
  visibility: 'public' | 'friends' | 'private';

  @Column('int', { array: true, nullable: true })
  allowedUserIds: number[] | null; // For private leaderboards

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 