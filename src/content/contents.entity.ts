import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Tag } from './tag.entity';
import { Category } from './category.entity';
import { ContentVersion } from './content_version.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { View } from './view.entity';

export type ContentStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';

@Entity('contents')
@Index('contents_fulltext_idx', ['title', 'body'], { fulltext: true }) // TypeORM index hint; real full-text uses tsvector SQL
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @ManyToOne(() => User, { eager: true })
  author: User;

  @Column({ type: 'enum', enum: ['draft','pending','published','rejected','archived'], default: 'draft' })
  status: ContentStatus;

  @ManyToOne(() => Category, (c) => c.contents, { nullable: true, eager: true })
  category: Category | null;

  @ManyToMany(() => Tag, (t) => t.contents, { cascade: true, eager: true })
  @JoinTable({ name: 'content_tags' })
  tags: Tag[];

  @OneToMany(() => ContentVersion, (v) => v.content, { cascade: true })
  versions: ContentVersion[];

  @OneToMany(() => Comment, (c) => c.content)
  comments: Comment[];

  @OneToMany(() => Like, (l) => l.content)
  likes: Like[];

  @OneToMany(() => View, (v) => v.content)
  views: View[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // meta fields
  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  shareCount: number;
}
