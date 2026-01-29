import { Injectable, NotFoundException } from '@nestjs/common';
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
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      // relations: ['puzzles'], // Include puzzles if you want to see them in the list
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      // relations: ['puzzles'], // Include puzzles for detailed view
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id); // Find existing category
    Object.assign(category, updateCategoryDto); // Apply updates
    return this.categoriesRepository.save(category);
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
