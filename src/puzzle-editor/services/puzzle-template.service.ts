/**
 * Puzzle Template Service
 * Manages puzzle templates for quick creation
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { PuzzleTemplate } from '../entities/puzzle-template.entity';
import { CreateTemplateDto } from '../dto';
import { EditorState } from '../interfaces/editor.interfaces';

@Injectable()
export class PuzzleTemplateService {
  private readonly logger = new Logger(PuzzleTemplateService.name);

  constructor(
    @InjectRepository(PuzzleTemplate)
    private templateRepository: Repository<PuzzleTemplate>,
  ) {}

  /**
   * Create new template
   */
  async createTemplate(dto: CreateTemplateDto, userId: string): Promise<PuzzleTemplate> {
    const template = this.templateRepository.create({
      ...dto,
      createdBy: userId,
      usageCount: 0,
      rating: 0,
    });

    const saved = await this.templateRepository.save(template);
    this.logger.log(`Created template: ${saved.id}`);

    return saved;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<PuzzleTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    return template;
  }

  /**
   * Get all templates with filters
   */
  async getAllTemplates(filters?: {
    puzzleType?: string;
    difficulty?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    templates: PuzzleTemplate[];
    total: number;
  }> {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 20, 100);
    const skip = (page - 1) * limit;

    let query = this.templateRepository.createQueryBuilder('template');

    if (filters?.puzzleType) {
      query = query.where('template.puzzleType = :puzzleType', { puzzleType: filters.puzzleType });
    }

    if (filters?.difficulty) {
      query = query.andWhere('template.difficulty = :difficulty', { difficulty: filters.difficulty });
    }

    if (filters?.category) {
      query = query.andWhere('template.category = :category', { category: filters.category });
    }

    if (filters?.search) {
      query = query.andWhere(
        '(template.name ILIKE :search OR template.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query = query.orderBy('template.usageCount', 'DESC').addOrderBy('template.rating', 'DESC');

    const [templates, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { templates, total };
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit: number = 10): Promise<PuzzleTemplate[]> {
    return this.templateRepository.find({
      order: { usageCount: 'DESC', rating: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get templates by puzzle type
   */
  async getTemplatesByType(puzzleType: string, limit: number = 10): Promise<PuzzleTemplate[]> {
    return this.templateRepository.find({
      where: { puzzleType },
      order: { rating: 'DESC', usageCount: 'DESC' },
      take: limit,
    });
  }

  /**
   * Rate template
   */
  async rateTemplate(templateId: string, rating: number): Promise<PuzzleTemplate> {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const template = await this.getTemplate(templateId);

    // Simple average rating (in production, track individual ratings)
    const currentTotal = template.rating * 10; // Assuming 10 previous ratings
    template.rating = (currentTotal + rating) / 11;

    return this.templateRepository.save(template);
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<PuzzleTemplate>,
    userId: string,
  ): Promise<PuzzleTemplate> {
    const template = await this.getTemplate(templateId);

    // Check permissions
    if (template.createdBy !== userId) {
      throw new BadRequestException('You can only update templates you created');
    }

    Object.assign(template, updates);
    return this.templateRepository.save(template);
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    const template = await this.getTemplate(templateId);

    // Check permissions
    if (template.createdBy !== userId) {
      throw new BadRequestException('You can only delete templates you created');
    }

    await this.templateRepository.remove(template);
  }

  /**
   * Get template categories
   */
  async getCategories(): Promise<string[]> {
    const results = await this.templateRepository
      .createQueryBuilder('template')
      .select('DISTINCT template.category')
      .orderBy('template.category', 'ASC')
      .getRawMany();

    return results.map((r) => r.template_category);
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<{
    totalTemplates: number;
    templatesByType: Record<string, number>;
    templatesByDifficulty: Record<string, number>;
    mostUsed: PuzzleTemplate[];
    highestRated: PuzzleTemplate[];
  }> {
    const templates = await this.templateRepository.find();

    const templatesByType: Record<string, number> = {};
    const templatesByDifficulty: Record<string, number> = {};

    templates.forEach((t) => {
      templatesByType[t.puzzleType] = (templatesByType[t.puzzleType] || 0) + 1;
      templatesByDifficulty[t.difficulty] = (templatesByDifficulty[t.difficulty] || 0) + 1;
    });

    const mostUsed = await this.templateRepository.find({
      order: { usageCount: 'DESC' },
      take: 5,
    });

    const highestRated = await this.templateRepository.find({
      order: { rating: 'DESC' },
      take: 5,
    });

    return {
      totalTemplates: templates.length,
      templatesByType,
      templatesByDifficulty,
      mostUsed,
      highestRated,
    };
  }
}
