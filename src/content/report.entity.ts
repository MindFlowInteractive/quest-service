import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Content } from './content.entity';
import { User } from '../users/entities/user.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Content, { eager: true })
  content: Content;

  @ManyToOne(() => User, { eager: true })
  reportedBy: User;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'enum', enum: ['open', 'reviewing', 'resolved', 'dismissed'], default: 'open' })
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;
}
