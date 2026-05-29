import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'date' })
  scheduledDate: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: 0 })
  streak: number;

  @CreateDateColumn()
  createdAt: Date;
}