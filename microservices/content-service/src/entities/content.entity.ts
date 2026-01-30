import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

export enum ContentType {
  PUZZLE = 'puzzle',
  ARTICLE = 'article',
  TUTORIAL = 'tutorial',
  CHALLENGE = 'challenge',
  MEDIA = 'media',
}

export enum ContentStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  FEATURED = 'featured',
  ARCHIVED = 'archived',
}

@Entity('contents')
@Index(['userId', 'status'])
@Index(['status', 'createdAt'])
@Index(['isPublic', 'status'])
@Index(['contentType', 'status'])
@Index(['category', 'status'])
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 200 })
  @Index()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ContentType,
    default: ContentType.ARTICLE,
  })
  @Index()
  contentType: ContentType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  category: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  @Index()
  status: ContentStatus;

  @Column({ type: 'jsonb', nullable: true })
  content: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    language?: string;
    difficulty?: string;
    estimatedReadTime?: number;
    version?: number;
    originalContentId?: string;
    [key: string]: any;
  };

  @Column({ type: 'boolean', default: false })
  @Index()
  isPublic: boolean;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Column({ type: 'int', default: 0 })
  qualityScore: number;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  featuredAt: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('Submission', 'content')
  submissions: any[];

  @OneToMany('ContentFile', 'content')
  files: any[];

  @OneToMany('FeaturedContent', 'content')
  featuredEntries: any[];
}
