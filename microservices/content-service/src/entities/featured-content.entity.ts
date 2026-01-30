import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Content } from './content.entity.js';

export enum FeaturedSlot {
  HOMEPAGE_HERO = 'homepage_hero',
  HOMEPAGE_CAROUSEL = 'homepage_carousel',
  WEEKLY_PICKS = 'weekly_picks',
  EDITOR_CHOICE = 'editor_choice',
  TRENDING = 'trending',
}

export enum FeaturedReason {
  AUTO_SELECTED = 'auto_selected',
  MANUAL_ADMIN = 'manual_admin',
  COMMUNITY_VOTED = 'community_voted',
  ALGORITHM = 'algorithm',
}

export interface FeaturedMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  engagements: number;
}

export interface SelectionCriteria {
  minRating?: number;
  minViews?: number;
  minAge?: number;
  maxAge?: number;
  maxPerCreator?: number;
  qualityThreshold?: number;
  [key: string]: any;
}

@Entity('featured_content')
@Index(['slot', 'isActive', 'position'])
@Index(['contentId', 'isActive'])
@Index(['startDate', 'endDate'])
@Index(['isActive', 'slot'])
export class FeaturedContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  contentId: string;

  @ManyToOne(() => Content, (content) => content.featuredEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contentId' })
  content: Content;

  @Column({
    type: 'enum',
    enum: FeaturedSlot,
  })
  @Index()
  slot: FeaturedSlot;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: FeaturedReason,
    default: FeaturedReason.AUTO_SELECTED,
  })
  reason: FeaturedReason;

  @Column({ type: 'uuid', nullable: true })
  featuredBy: string;

  @Column({ type: 'timestamp' })
  @Index()
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  endDate: Date | null;

  @Column({ type: 'jsonb', default: { impressions: 0, clicks: 0, ctr: 0, engagements: 0 } })
  metrics: FeaturedMetrics;

  @Column({ type: 'jsonb', nullable: true })
  selectionCriteria: SelectionCriteria;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  selectionScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
