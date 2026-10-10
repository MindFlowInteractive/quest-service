import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryFilterDto, CategoryAnalyticsDto } from './dto/category-filter.dto';
import { Puzzle } from './entities/puzzle.entity';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Puzzle)
    private readonly puzzlesRepository: Repository<Puzzle>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    if (createCategoryDto.parentId) {
      const parent = await this.categoriesRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID "${createCategoryDto.parentId}" not found`,
        );
      }
    }

    const slug =
      createCategoryDto.slug ||
      createCategoryDto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      slug,
      displayOrder: createCategoryDto.displayOrder ?? 0,
      isActive: createCategoryDto.isActive ?? true,
    });

    return this.categoriesRepository.save(category);
  }

  async findAll(filter?: CategoryFilterDto): Promise<Category[]> {
    const qb = this.categoriesRepository.createQueryBuilder('category');

    if (filter?.isActive !== undefined) {
      qb.andWhere('category.isActive = :isActive', { isActive: filter.isActive });
    }

    if (filter?.parentId) {
      qb.andWhere('category.parentId = :parentId', { parentId: filter.parentId });
    }

    if (filter?.search) {
      qb.andWhere(
        '(LOWER(category.name) LIKE LOWER(:search) OR LOWER(category.description) LIKE LOWER(:search))',
        { search: `%${filter.search}%` },
      );
    }

    qb.orderBy('category.displayOrder', 'ASC').addOrderBy('category.name', 'ASC');

    if (filter?.limit) {
      qb.take(filter.limit);
    }
    if (filter?.offset) {
      qb.skip(filter.offset);
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'puzzles'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      const parent = await this.categoriesRepository.findOne({
        where: { id: updateCategoryDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID "${updateCategoryDto.parentId}" not found`,
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    const result = await this.categoriesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
  }

  /**
   * Builds and returns full hierarchical tree of categories.
   */
  async getHierarchy(): Promise<Category[]> {
    const allCategories = await this.categoriesRepository.find({
      relations: ['children', 'puzzles'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    const categoryMap = new Map<string, Category>();
    allCategories.forEach((cat) => {
      cat.children = [];
      categoryMap.set(cat.id, cat);
    });

    const roots: Category[] = [];
    allCategories.forEach((cat) => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children.push(cat);
      } else {
        roots.push(cat);
      }
    });

    return roots;
  }

  /**
   * Collects analytics and popularity score for category.
   */
  async getCategoryAnalytics(id?: string): Promise<CategoryAnalyticsDto[]> {
    const categories = id
      ? [await this.findOne(id)]
      : await this.categoriesRepository.find({ relations: ['puzzles'] });

    return categories.map((cat) => {
      const puzzles = cat.puzzles || [];
      const totalPuzzles = puzzles.length;
      const totalCompletions = puzzles.reduce(
        (sum, p) => sum + (p.completions || 0),
        0,
      );
      const totalRating = puzzles.reduce(
        (sum, p) => sum + Number(p.averageRating || 0),
        0,
      );
      const averageRating =
        totalPuzzles > 0 ? Number((totalRating / totalPuzzles).toFixed(2)) : 0;

      const difficultyBreakdown: Record<string, number> = {
        easy: 0,
        medium: 0,
        hard: 0,
        expert: 0,
      };
      puzzles.forEach((p) => {
        if (p.difficulty && difficultyBreakdown[p.difficulty] !== undefined) {
          difficultyBreakdown[p.difficulty]++;
        }
      });

      // Popularity formula: completions * 2 + totalPuzzles * 5 + averageRating * 10
      const popularityScore = Math.round(
        totalCompletions * 2 + totalPuzzles * 5 + averageRating * 10,
      );

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        totalPuzzles,
        totalCompletions,
        averageRating,
        difficultyBreakdown,
        popularityScore,
      };
    });
  }

  /**
   * Recommends active categories sorted by popularity and content density.
   */
  async getRecommendations(limit = 5): Promise<Category[]> {
    const analytics = await this.getCategoryAnalytics();
    analytics.sort((a, b) => b.popularityScore - a.popularityScore);

    const topIds = analytics.slice(0, limit).map((a) => a.categoryId);
    if (topIds.length === 0) {
      return this.categoriesRepository.find({ take: limit });
    }

    const categories = await this.categoriesRepository
      .createQueryBuilder('category')
      .where('category.id IN (:...ids)', { ids: topIds })
      .getMany();

    // Preserve order of popularity
    const catMap = new Map(categories.map((c) => [c.id, c]));
    return topIds
      .map((tid) => catMap.get(tid))
      .filter((c): c is Category => c !== undefined);
  }

  /**
   * Searches and filters puzzles within a category and optionally its subcategories.
   */
  async searchPuzzlesByCategory(
    categoryId: string,
    filter?: CategoryFilterDto,
  ): Promise<Puzzle[]> {
    const category = await this.findOne(categoryId);

    // Collect category ID and any child category IDs if includeChildren is true
    let categoryIds = [category.id];
    if (filter?.includeChildren && category.children?.length) {
      categoryIds = categoryIds.concat(category.children.map((c) => c.id));
    }

    const qb = this.puzzlesRepository
      .createQueryBuilder('puzzle')
      .leftJoinAndSelect('puzzle.categories', 'category')
      .leftJoinAndSelect('puzzle.tagEntities', 'tag')
      .where('category.id IN (:...categoryIds)', { categoryIds });

    if (filter?.difficulty) {
      qb.andWhere('puzzle.difficulty = :difficulty', {
        difficulty: filter.difficulty,
      });
    }

    if (filter?.tags && filter.tags.length > 0) {
      qb.andWhere('tag.name IN (:...tags)', { tags: filter.tags });
    }

    if (filter?.search) {
      qb.andWhere(
        '(LOWER(puzzle.title) LIKE LOWER(:search) OR LOWER(puzzle.description) LIKE LOWER(:search))',
        { search: `%${filter.search}%` },
      );
    }

    qb.orderBy('puzzle.averageRating', 'DESC').addOrderBy(
      'puzzle.createdAt',
      'DESC',
    );

    if (filter?.limit) {
      qb.take(filter.limit);
    }
    if (filter?.offset) {
      qb.skip(filter.offset);
    }

    return qb.getMany();
  }

  getCategoryRepository(): Repository<Category> {
    return this.categoriesRepository;
  }
}
