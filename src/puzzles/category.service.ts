import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Puzzle } from './entities/puzzle.entity'; // Import Puzzle entity for relation management

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Puzzle) // Inject Puzzle repository for potential relation operations
    private puzzlesRepository: Repository<Puzzle>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { parentCategoryId, ...data } = createCategoryDto;
    const parentCategory = parentCategoryId
      ? await this.findOne(parentCategoryId)
      : undefined;
    const category = this.categoriesRepository.create({ ...data, parentCategory });
    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      relations: ['parentCategory', 'children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parentCategory'],
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
    const category = await this.findOne(id); // Find existing category
    const { parentCategoryId, ...data } = updateCategoryDto;
    if (parentCategoryId !== undefined) {
      if (parentCategoryId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      category.parentCategory = parentCategoryId
        ? await this.findOne(parentCategoryId)
        : null;
      // Prevent introducing a cycle in the hierarchy.
      let ancestor = category.parentCategory;
      while (ancestor) {
        if (ancestor.id === id) {
          throw new BadRequestException('Category hierarchy cannot contain cycles');
        }
        ancestor = ancestor.parentCategory;
        if (ancestor?.id) {
          ancestor = await this.categoriesRepository.findOne({
            where: { id: ancestor.id }, relations: ['parentCategory'],
          });
        }
      }
    }
    Object.assign(category, data);
    return this.categoriesRepository.save(category);
  }

  async analytics() {
    const rows = await this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoin('category.puzzles', 'puzzle')
      .select('category.id', 'id')
      .addSelect('category.name', 'name')
      .addSelect('COUNT(DISTINCT puzzle.id)', 'puzzleCount')
      .addSelect('COALESCE(SUM(puzzle.attempts), 0)', 'attempts')
      .addSelect('COALESCE(SUM(puzzle.completions), 0)', 'completions')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('COUNT(DISTINCT puzzle.id)', 'DESC')
      .getRawMany();
    return rows.map((row) => ({
      ...row,
      puzzleCount: Number(row.puzzleCount),
      attempts: Number(row.attempts),
      completions: Number(row.completions),
    }));
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // Before deleting, consider how to handle associated puzzles.
    // For example, you might want to:
    // 1. Remove the category from all associated puzzles.
    // 2. Prevent deletion if any puzzles are associated with it.
    // 3. Cascade delete (less common for categories).

    // For now, we will simply remove the category. If TypeORM is configured with cascade
    // options for the relation, it might handle some aspects.
    // A more robust approach would be to disassociate puzzles first.

    // Example: Disassociate puzzles
    // category.puzzles = [];
    // await this.categoriesRepository.save(category); // Save with empty puzzles array

    // A simpler approach for now: just remove the category.
    const result = await this.categoriesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
  }

  // Helper method to get repository if needed in other services
  getCategoryRepository(): Repository<Category> {
    return this.categoriesRepository;
  }
}
