import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeaturedContent, FeaturedSlot, FeaturedReason } from '../entities/featured-content.entity.js';
import { ContentService } from '../content/content.service.js';
import { ContentStatus } from '../entities/content.entity.js';
import { CreateFeaturedDto } from './dto/create-featured.dto.js';
import { FeaturedRotationService } from './featured-rotation.service.js';

@Injectable()
export class FeaturedService {
  private readonly logger = new Logger(FeaturedService.name);

  constructor(
    @InjectRepository(FeaturedContent)
    private readonly featuredRepository: Repository<FeaturedContent>,
    private readonly contentService: ContentService,
    private readonly rotationService: FeaturedRotationService,
  ) {}

  async findAll(): Promise<Record<FeaturedSlot, FeaturedContent[]>> {
    const allFeatured = await this.featuredRepository.find({
      where: { isActive: true },
      relations: ['content'],
      order: { slot: 'ASC', position: 'ASC' },
    });

    const result: Record<FeaturedSlot, FeaturedContent[]> = {
      [FeaturedSlot.HOMEPAGE_HERO]: [],
      [FeaturedSlot.HOMEPAGE_CAROUSEL]: [],
      [FeaturedSlot.WEEKLY_PICKS]: [],
      [FeaturedSlot.EDITOR_CHOICE]: [],
      [FeaturedSlot.TRENDING]: [],
    };

    for (const featured of allFeatured) {
      result[featured.slot].push(featured);
    }

    return result;
  }

  async findBySlot(slot: FeaturedSlot): Promise<FeaturedContent[]> {
    return this.featuredRepository.find({
      where: { slot, isActive: true },
      relations: ['content'],
      order: { position: 'ASC' },
    });
  }

  async create(createFeaturedDto: CreateFeaturedDto, adminId: string): Promise<FeaturedContent> {
    const content = await this.contentService.findOne(createFeaturedDto.contentId);

    if (content.status !== ContentStatus.PUBLISHED && content.status !== ContentStatus.FEATURED) {
      throw new BadRequestException('Only published content can be featured');
    }

    const existingFeatured = await this.featuredRepository.findOne({
      where: {
        contentId: createFeaturedDto.contentId,
        slot: createFeaturedDto.slot,
        isActive: true,
      },
    });

    if (existingFeatured) {
      throw new BadRequestException('Content is already featured in this slot');
    }

    const maxPosition = await this.featuredRepository
      .createQueryBuilder('featured')
      .select('MAX(featured.position)', 'max')
      .where('featured.slot = :slot', { slot: createFeaturedDto.slot })
      .andWhere('featured.isActive = :isActive', { isActive: true })
      .getRawOne();

    const position = createFeaturedDto.position ?? (maxPosition?.max ?? -1) + 1;

    const startDate = createFeaturedDto.startDate
      ? new Date(createFeaturedDto.startDate)
      : new Date();

    const endDate = createFeaturedDto.endDate
      ? new Date(createFeaturedDto.endDate)
      : null;

    const selectionScore = this.rotationService.calculateSelectionScore(content);

    const featured = this.featuredRepository.create({
      contentId: createFeaturedDto.contentId,
      slot: createFeaturedDto.slot,
      position,
      isActive: true,
      reason: createFeaturedDto.reason ?? FeaturedReason.MANUAL_ADMIN,
      featuredBy: adminId,
      startDate,
      endDate,
      selectionScore,
    });

    const savedFeatured = await this.featuredRepository.save(featured);

    await this.contentService.updateStatus(createFeaturedDto.contentId, ContentStatus.FEATURED);

    this.logger.log(
      `Content ${createFeaturedDto.contentId} featured in slot ${createFeaturedDto.slot} by admin ${adminId}`,
    );

    return savedFeatured;
  }

  async remove(id: string): Promise<void> {
    const featured = await this.featuredRepository.findOne({
      where: { id },
      relations: ['content'],
    });

    if (!featured) {
      throw new NotFoundException(`Featured content with ID ${id} not found`);
    }

    featured.isActive = false;
    await this.featuredRepository.save(featured);

    const otherFeatured = await this.featuredRepository.findOne({
      where: { contentId: featured.contentId, isActive: true },
    });

    if (!otherFeatured) {
      await this.contentService.updateStatus(featured.contentId, ContentStatus.PUBLISHED);
    }

    this.logger.log(`Featured content ${id} removed`);
  }

  async updatePosition(id: string, newPosition: number): Promise<FeaturedContent> {
    const featured = await this.featuredRepository.findOne({ where: { id } });

    if (!featured) {
      throw new NotFoundException(`Featured content with ID ${id} not found`);
    }

    featured.position = newPosition;
    return this.featuredRepository.save(featured);
  }

  async triggerRotation(slot: FeaturedSlot): Promise<void> {
    await this.rotationService.rotateSlot(slot);
  }

  async trackImpression(id: string): Promise<void> {
    await this.rotationService.recordImpression(id);
  }

  async trackClick(id: string): Promise<void> {
    await this.rotationService.recordClick(id);
  }
}
