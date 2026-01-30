import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { FeaturedContent, FeaturedSlot, FeaturedReason, SelectionCriteria } from '../entities/featured-content.entity.js';
import { Content, ContentStatus } from '../entities/content.entity.js';

interface SlotConfig {
  maxItems: number;
  minRating: number;
  minViews: number;
  minAgeInDays: number;
  maxAgeInDays: number;
  maxPerCreator: number;
}

@Injectable()
export class FeaturedRotationService {
  private readonly logger = new Logger(FeaturedRotationService.name);

  private readonly defaultConfig: Record<FeaturedSlot, SlotConfig> = {
    [FeaturedSlot.HOMEPAGE_HERO]: {
      maxItems: 1,
      minRating: 4.5,
      minViews: 200,
      minAgeInDays: 7,
      maxAgeInDays: 60,
      maxPerCreator: 1,
    },
    [FeaturedSlot.HOMEPAGE_CAROUSEL]: {
      maxItems: 5,
      minRating: 4.0,
      minViews: 50,
      minAgeInDays: 7,
      maxAgeInDays: 90,
      maxPerCreator: 2,
    },
    [FeaturedSlot.WEEKLY_PICKS]: {
      maxItems: 3,
      minRating: 4.2,
      minViews: 100,
      minAgeInDays: 0,
      maxAgeInDays: 7,
      maxPerCreator: 1,
    },
    [FeaturedSlot.EDITOR_CHOICE]: {
      maxItems: 5,
      minRating: 4.5,
      minViews: 150,
      minAgeInDays: 14,
      maxAgeInDays: 180,
      maxPerCreator: 1,
    },
    [FeaturedSlot.TRENDING]: {
      maxItems: 10,
      minRating: 3.5,
      minViews: 20,
      minAgeInDays: 0,
      maxAgeInDays: 14,
      maxPerCreator: 2,
    },
  };

  constructor(
    @InjectRepository(FeaturedContent)
    private readonly featuredRepository: Repository<FeaturedContent>,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async rotateDailyCarousel(): Promise<void> {
    this.logger.log('Starting daily homepage carousel rotation');
    try {
      await this.rotateSlot(FeaturedSlot.HOMEPAGE_CAROUSEL);
      await this.rotateSlot(FeaturedSlot.HOMEPAGE_HERO);
      this.logger.log('Completed daily carousel rotation');
    } catch (error) {
      this.logger.error('Error during daily carousel rotation:', error);
    }
  }

  @Cron('0 2 * * 0')
  async rotateWeeklyPicks(): Promise<void> {
    this.logger.log('Starting weekly picks rotation');
    try {
      await this.rotateSlot(FeaturedSlot.WEEKLY_PICKS);
      this.logger.log('Completed weekly picks rotation');
    } catch (error) {
      this.logger.error('Error during weekly picks rotation:', error);
    }
  }

  @Cron('0 */6 * * *')
  async updateTrending(): Promise<void> {
    this.logger.log('Starting trending content update');
    try {
      await this.rotateSlot(FeaturedSlot.TRENDING);
      this.logger.log('Completed trending content update');
    } catch (error) {
      this.logger.error('Error during trending update:', error);
    }
  }

  async rotateSlot(slot: FeaturedSlot): Promise<void> {
    const config = this.defaultConfig[slot];

    await this.unfeatureExpiredContent(slot);

    const candidates = await this.selectCandidates(slot, config);

    await this.featureContent(slot, candidates, config);
  }

  private async unfeatureExpiredContent(slot: FeaturedSlot): Promise<void> {
    const now = new Date();

    await this.featuredRepository.update(
      {
        slot,
        isActive: true,
        endDate: LessThan(now),
      },
      { isActive: false },
    );

    await this.featuredRepository.update(
      {
        slot,
        isActive: true,
      },
      { isActive: false },
    );
  }

  private async selectCandidates(slot: FeaturedSlot, config: SlotConfig): Promise<Content[]> {
    const now = new Date();
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - config.maxAgeInDays);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - config.minAgeInDays);

    const currentlyFeatured = await this.featuredRepository.find({
      where: { slot, isActive: true },
      select: ['contentId'],
    });
    const excludeIds = currentlyFeatured.map((f) => f.contentId);

    let queryBuilder = this.contentRepository
      .createQueryBuilder('content')
      .where('content.status = :status', { status: ContentStatus.PUBLISHED })
      .andWhere('content.isPublic = :isPublic', { isPublic: true })
      .andWhere('content.averageRating >= :minRating', { minRating: config.minRating })
      .andWhere('content.views >= :minViews', { minViews: config.minViews })
      .andWhere('content.publishedAt >= :minDate', { minDate })
      .andWhere('content.publishedAt <= :maxDate', { maxDate });

    if (excludeIds.length > 0) {
      queryBuilder = queryBuilder.andWhere('content.id NOT IN (:...excludeIds)', { excludeIds });
    }

    const candidates = await queryBuilder
      .orderBy('content.qualityScore', 'DESC')
      .addOrderBy('content.averageRating', 'DESC')
      .addOrderBy('content.views', 'DESC')
      .take(config.maxItems * 3)
      .getMany();

    return this.applyDiversityFilter(candidates, config);
  }

  private applyDiversityFilter(candidates: Content[], config: SlotConfig): Content[] {
    const selected: Content[] = [];
    const creatorCounts: Map<string, number> = new Map();

    for (const content of candidates) {
      if (selected.length >= config.maxItems) break;

      const creatorCount = creatorCounts.get(content.userId) || 0;
      if (creatorCount >= config.maxPerCreator) continue;

      selected.push(content);
      creatorCounts.set(content.userId, creatorCount + 1);
    }

    return selected;
  }

  private async featureContent(
    slot: FeaturedSlot,
    candidates: Content[],
    config: SlotConfig,
  ): Promise<void> {
    const now = new Date();
    const endDate = this.calculateEndDate(slot);

    for (let i = 0; i < candidates.length; i++) {
      const content = candidates[i];
      const selectionScore = this.calculateSelectionScore(content);

      const featured = this.featuredRepository.create({
        contentId: content.id,
        slot,
        position: i,
        isActive: true,
        reason: FeaturedReason.ALGORITHM,
        startDate: now,
        endDate,
        selectionScore,
        selectionCriteria: {
          minRating: config.minRating,
          minViews: config.minViews,
          minAge: config.minAgeInDays,
          maxAge: config.maxAgeInDays,
          maxPerCreator: config.maxPerCreator,
        },
      });

      await this.featuredRepository.save(featured);
      this.logger.log(`Featured content ${content.id} in slot ${slot} at position ${i}`);
    }
  }

  private calculateEndDate(slot: FeaturedSlot): Date {
    const endDate = new Date();

    switch (slot) {
      case FeaturedSlot.HOMEPAGE_HERO:
        endDate.setDate(endDate.getDate() + 3);
        break;
      case FeaturedSlot.HOMEPAGE_CAROUSEL:
        endDate.setDate(endDate.getDate() + 1);
        break;
      case FeaturedSlot.WEEKLY_PICKS:
        endDate.setDate(endDate.getDate() + 7);
        break;
      case FeaturedSlot.EDITOR_CHOICE:
        endDate.setDate(endDate.getDate() + 30);
        break;
      case FeaturedSlot.TRENDING:
        endDate.setHours(endDate.getHours() + 6);
        break;
      default:
        endDate.setDate(endDate.getDate() + 1);
    }

    return endDate;
  }

  calculateSelectionScore(content: Content): number {
    const ratingScore = (content.averageRating || 0) * 25;

    const viewScore = Math.min(content.views / 100, 10) * 15;

    const qualityScore = (content.qualityScore || 0) * 0.2;

    const ageInDays = content.publishedAt
      ? (Date.now() - new Date(content.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 30;
    const recencyBonus = Math.max(0, 15 - ageInDays * 0.2);

    const engagementRate = content.views > 0 ? (content.likes / content.views) * 100 : 0;
    const engagementBonus = Math.min(engagementRate * 3, 15);

    const diversityBonus = 10;

    return (
      ratingScore +
      viewScore +
      qualityScore +
      recencyBonus +
      engagementBonus +
      diversityBonus
    );
  }

  async recordImpression(featuredId: string): Promise<void> {
    await this.featuredRepository
      .createQueryBuilder()
      .update(FeaturedContent)
      .set({
        metrics: () => `jsonb_set(metrics, '{impressions}', (COALESCE(metrics->>'impressions', '0')::int + 1)::text::jsonb)`,
      })
      .where('id = :id', { id: featuredId })
      .execute();
  }

  async recordClick(featuredId: string): Promise<void> {
    const featured = await this.featuredRepository.findOne({ where: { id: featuredId } });
    if (featured) {
      const metrics = featured.metrics;
      metrics.clicks += 1;
      metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
      await this.featuredRepository.update(featuredId, { metrics });
    }
  }
}
