import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Content } from './content.entity';
import { User } from '../users/entities/user.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Content, (c) => c.comments, { onDelete: 'CASCADE', eager: true })
  content: Content;

  @ManyToOne(() => User, { eager: true })
  author: User;

  @Column({ type: 'text' })
  text: string;

  @Column({ default: false })
  moderated: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
