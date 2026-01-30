import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Content, ContentStatus } from '../entities/content.entity.js';
import { CreateContentDto } from './dto/create-content.dto.js';
import { UpdateContentDto } from './dto/update-content.dto.js';
import { ContentFilterDto } from './dto/content-filter.dto.js';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  async create(createContentDto: CreateContentDto): Promise<Content> {
    const content = this.contentRepository.create({
      ...createContentDto,
      status: ContentStatus.DRAFT,
    });

    const savedContent = await this.contentRepository.save(content);
    this.logger.log(`Content created: ${savedContent.id} by user ${savedContent.userId}`);
    return savedContent;
  }

  async findAll(filterDto: ContentFilterDto): Promise<{ data: Content[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.createFilterQuery(filterDto);

    queryBuilder
      .orderBy(`content.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findByUser(userId: string, filterDto: ContentFilterDto): Promise<{ data: Content[]; total: number; page: number; limit: number }> {
    return this.findAll({ ...filterDto, userId });
  }

  async findOne(id: string): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: ['files'],
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return content;
  }

  async findPublicContent(id: string): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id, isPublic: true, status: ContentStatus.PUBLISHED },
      relations: ['files'],
    });

    if (!content) {
      throw new NotFoundException(`Public content with ID ${id} not found`);
    }

    await this.incrementViews(id);
    return content;
  }

  async update(id: string, userId: string, updateContentDto: UpdateContentDto): Promise<Content> {
    const content = await this.findOne(id);

    if (content.userId !== userId) {
      throw new ForbiddenException('You can only update your own content');
    }

    if (content.status !== ContentStatus.DRAFT && content.status !== ContentStatus.REJECTED) {
      const allowedUpdates = ['metadata'];
      const attemptedUpdates = Object.keys(updateContentDto);
      const disallowedUpdates = attemptedUpdates.filter(key => !allowedUpdates.includes(key));

      if (disallowedUpdates.length > 0) {
        throw new ForbiddenException(
          `Cannot update ${disallowedUpdates.join(', ')} for content with status ${content.status}`,
        );
      }
    }

    Object.assign(content, updateContentDto);
    const savedContent = await this.contentRepository.save(content);
    this.logger.log(`Content updated: ${id}`);
    return savedContent;
  }

  async delete(id: string, userId: string): Promise<void> {
    const content = await this.findOne(id);

    if (content.userId !== userId) {
      throw new ForbiddenException('You can only delete your own content');
    }

    if (content.status === ContentStatus.PUBLISHED || content.status === ContentStatus.FEATURED) {
      throw new ForbiddenException('Cannot delete published or featured content');
    }

    await this.contentRepository.remove(content);
    this.logger.log(`Content deleted: ${id}`);
  }

  async discover(filterDto: ContentFilterDto): Promise<{ data: Content[]; total: number; page: number; limit: number }> {
    const publicFilter: ContentFilterDto = {
      ...filterDto,
      isPublic: true,
      status: ContentStatus.PUBLISHED,
    };
    return this.findAll(publicFilter);
  }

  async updateStatus(id: string, status: ContentStatus): Promise<Content> {
    const content = await this.findOne(id);
    content.status = status;

    if (status === ContentStatus.SUBMITTED) {
      content.submittedAt = new Date();
    } else if (status === ContentStatus.PUBLISHED) {
      content.publishedAt = new Date();
      content.isPublic = true;
    } else if (status === ContentStatus.FEATURED) {
      content.featuredAt = new Date();
    }

    return this.contentRepository.save(content);
  }

  async incrementViews(id: string): Promise<void> {
    await this.contentRepository.increment({ id }, 'views', 1);
  }

  async incrementLikes(id: string): Promise<void> {
    await this.contentRepository.increment({ id }, 'likes', 1);
  }

  async decrementLikes(id: string): Promise<void> {
    await this.contentRepository.decrement({ id }, 'likes', 1);
  }

  async updateRating(id: string, averageRating: number, ratingCount: number): Promise<void> {
    await this.contentRepository.update(id, { averageRating, ratingCount });
  }

  async updateQualityScore(id: string, qualityScore: number): Promise<void> {
    await this.contentRepository.update(id, { qualityScore });
  }

  async archiveUserContent(userId: string): Promise<void> {
    await this.contentRepository.update(
      { userId },
      { status: ContentStatus.ARCHIVED, isPublic: false },
    );
    this.logger.log(`All content archived for user: ${userId}`);
  }

  async getContentForFeaturing(minRating: number = 4.0, minViews: number = 50, limit: number = 50): Promise<Content[]> {
    const minAge = new Date();
    minAge.setDate(minAge.getDate() - 7);

    const maxAge = new Date();
    maxAge.setDate(maxAge.getDate() - 90);

    return this.contentRepository
      .createQueryBuilder('content')
      .where('content.status = :status', { status: ContentStatus.PUBLISHED })
      .andWhere('content.isPublic = :isPublic', { isPublic: true })
      .andWhere('content.averageRating >= :minRating', { minRating })
      .andWhere('content.views >= :minViews', { minViews })
      .andWhere('content.publishedAt <= :minAge', { minAge })
      .andWhere('content.publishedAt >= :maxAge', { maxAge })
      .orderBy('content.qualityScore', 'DESC')
      .addOrderBy('content.averageRating', 'DESC')
      .addOrderBy('content.views', 'DESC')
      .take(limit)
      .getMany();
  }

  private createFilterQuery(filterDto: ContentFilterDto): SelectQueryBuilder<Content> {
    const queryBuilder = this.contentRepository.createQueryBuilder('content');

    if (filterDto.userId) {
      queryBuilder.andWhere('content.userId = :userId', { userId: filterDto.userId });
    }

    if (filterDto.contentType) {
      queryBuilder.andWhere('content.contentType = :contentType', { contentType: filterDto.contentType });
    }

    if (filterDto.status) {
      queryBuilder.andWhere('content.status = :status', { status: filterDto.status });
    }

    if (filterDto.category) {
      queryBuilder.andWhere('content.category = :category', { category: filterDto.category });
    }

    if (filterDto.tags && filterDto.tags.length > 0) {
      queryBuilder.andWhere('content.tags && :tags', { tags: filterDto.tags });
    }

    if (filterDto.isPublic !== undefined) {
      queryBuilder.andWhere('content.isPublic = :isPublic', { isPublic: filterDto.isPublic });
    }

    if (filterDto.search) {
      queryBuilder.andWhere(
        '(content.title ILIKE :search OR content.description ILIKE :search)',
        { search: `%${filterDto.search}%` },
      );
    }

    if (filterDto.minRating !== undefined) {
      queryBuilder.andWhere('content.averageRating >= :minRating', { minRating: filterDto.minRating });
    }

    if (filterDto.minViews !== undefined) {
      queryBuilder.andWhere('content.views >= :minViews', { minViews: filterDto.minViews });
    }

    return queryBuilder;
  }
}
