import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  Index,
} from 'typeorm';
import { Bookmark } from '../bookmarks/bookmark.entity';

@Entity('tags')
@Index(['userId', 'name'], { unique: true })
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('varchar')
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => Bookmark, bookmark => bookmark.tags)
  bookmarks: Bookmark[];
}