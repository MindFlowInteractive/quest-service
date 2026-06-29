import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: 30 })
  timeLimitSeconds: number;

  @Column({ default: false })
  isMultiplayer: boolean;

  @CreateDateColumn()
  createdAt: Date;
}