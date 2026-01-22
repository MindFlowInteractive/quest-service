import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { Puzzle } from './entities/puzzle.entity';
import { Category } from './entities/category.entity';
import { UserCollectionProgress } from '../user-progress/entities/user-collection-progress.entity'; // Import for relation

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private collectionsRepository: Repository<Collection>,
    @InjectRepository(Puzzle)
    private puzzlesRepository: Repository<Puzzle>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(UserCollectionProgress) // Inject for potential future use or relation loading
    private userCollectionProgressRepository: Repository<UserCollectionProgress>,
  ) {}

  async create(createCollectionDto: CreateCollectionDto): Promise<Collection> {
    const { puzzleIds, categoryIds, rewards, ...collectionData } = createCollectionDto;

    const collection = this.collectionsRepository.create({
      ...collectionData,
      rewards: rewards || [], // Initialize rewards
    });

    // Associate puzzles
    if (puzzleIds && puzzleIds.length > 0) {
      const puzzles = await this.puzzlesRepository.findBy({ id: In(puzzleIds) });
      if (puzzles.length !== puzzleIds.length) {
        throw new BadRequestException('One or more puzzle IDs not found.');
      }
      collection.puzzles = puzzles;
    }

    // Associate categories
    if (categoryIds && categoryIds.length > 0) {
      const categories = await this.categoriesRepository.findBy({ id: In(categoryIds) });
      if (categories.length !== categoryIds.length) {
        throw new BadRequestException('One or more category IDs not found.');
      }
      collection.categories = categories;
    }

    return this.collectionsRepository.save(collection);
  }

  async findAll(): Promise<Collection[]> {
    return this.collectionsRepository.find({
      relations: ['puzzles', 'categories', 'userProgress'], // Load related entities
    });
  }

  async findOne(id: string): Promise<Collection> {
    const collection = await this.collectionsRepository.findOne({
      where: { id },
      relations: ['puzzles', 'categories', 'userProgress'], // Load related entities
    });
    if (!collection) {
      throw new NotFoundException(`Collection with ID "${id}" not found`);
    }
    return collection;
  }

  async update(id: string, updateCollectionDto: UpdateCollectionDto): Promise<Collection> {
    const collection = await this.findOne(id);

    const { puzzleIds, categoryIds, rewards, ...collectionData } = updateCollectionDto;

    Object.assign(collection, collectionData);

    // Update rewards if provided
    if (rewards !== undefined) {
      // Basic validation for reward structure could be added here if needed
      collection.rewards = rewards;
    }

    // Re-associate puzzles if provided
    if (puzzleIds !== undefined) {
      if (puzzleIds.length > 0) {
        const puzzles = await this.puzzlesRepository.findBy({ id: In(puzzleIds) });
        if (puzzles.length !== puzzleIds.length) {
          throw new BadRequestException('One or more puzzle IDs not found.');
        }
        collection.puzzles = puzzles;
      } else {
        collection.puzzles = [];
      }
    }

    // Re-associate categories if provided
    if (categoryIds !== undefined) {
      if (categoryIds.length > 0) {
        const categories = await this.categoriesRepository.findBy({ id: In(categoryIds) });
        if (categories.length !== categoryIds.length) {
          throw new BadRequestException('One or more category IDs not found.');
        }
        collection.categories = categories;
      } else {
        collection.categories = [];
      }
    }

    return this.collectionsRepository.save(collection);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Ensure collection exists
    const result = await this.collectionsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Collection with ID "${id}" not found`);
    }
  }

  // --- New method to grant rewards when a collection is completed ---
  // This method would be called by UserCollectionProgressService when isCompleted becomes true.
  async grantRewards(collectionId: string, userId: string): Promise<void> {
    const collection = await this.findOne(collectionId); // Loads relations including rewards

    if (!collection.rewards || collection.rewards.length === 0) {
      // No rewards to grant for this collection
      return;
    }

    // TODO: Implement reward granting logic. This will likely involve:
    // 1. Interacting with an 'EconomyService' or 'UserInventoryService'
    //    (which might not exist yet).
    // 2. Processing each reward object in collection.rewards.
    // 3. For 'currency', add value to user's balance.
    // 4. For 'item', add item to user's inventory.
    // 5. For 'experience', add XP to user's profile.
    //
    // Example placeholder for currency reward:
    // if (reward.type === 'currency') {
    //   // await economyService.addCurrency(userId, reward.value.amount);
    // }

    console.log(`Granting ${collection.rewards.length} rewards to user ${userId} for completing collection ${collectionId}.`);
    // For now, just log the action.
  }

  // Helper method to get repository
  getCollectionRepository(): Repository<Collection> {
    return this.collectionsRepository;
  }
}

// Helper to import In from TypeORM if not already globally available
import { In } from 'typeorm';