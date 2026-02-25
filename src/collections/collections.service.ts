import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CollectionEntity } from './entities/collection.entity';
import { Category } from './entities/category.entity';
import { PuzzleCollection } from './entities/puzzle-collection.entity';
import { UserPuzzleCompletion } from './entities/user-puzzle-completion.entity';
import { UserCollectionProgress } from './entities/user-collection-progress.entity';
import { RewardService } from './reward.service';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CollectionEntity)
    private collectionsRepo: Repository<CollectionEntity>,
    @InjectRepository(Category)
    private categoriesRepo: Repository<Category>,
    @InjectRepository(PuzzleCollection)
    private puzzleCollectionRepo: Repository<PuzzleCollection>,
    @InjectRepository(UserPuzzleCompletion)
    private userPuzzleCompletionRepo: Repository<UserPuzzleCompletion>,
    @InjectRepository(UserCollectionProgress)
    private userCollectionProgressRepo: Repository<UserCollectionProgress>,
    private dataSource: DataSource,
    private rewardService: RewardService,
  ) {}

  async createCollection(dto: Partial<CollectionEntity>) {
    if (dto.reward_value && dto.reward_value < 0) throw new BadRequestException('reward cannot be negative');
    if (dto.category_id) {
      const cat = await this.categoriesRepo.findOneBy({ id: dto.category_id });
      if (!cat) throw new BadRequestException('category must exist');
    }

    // slug uniqueness enforced at Category level; collection title uniqueness not required
    const col = this.collectionsRepo.create(dto as any);
    return this.collectionsRepo.save(col);
  }

  async updateCollection(id: string, dto: Partial<CollectionEntity>) {
    if (dto.reward_value !== undefined && dto.reward_value < 0) throw new BadRequestException('reward cannot be negative');
    if (dto.category_id) {
      const cat = await this.categoriesRepo.findOneBy({ id: dto.category_id });
      if (!cat) throw new BadRequestException('category must exist');
    }
    await this.collectionsRepo.update(id, dto as any);
    return this.collectionsRepo.findOneBy({ id });
  }

  async deleteCollection(id: string) {
    return this.collectionsRepo.delete(id);
  }

  async getCollectionById(id: string) {
    return this.collectionsRepo.findOne({ where: { id } });
  }

  async listCollections(page = 0, limit = 20) {
    return this.collectionsRepo.find({ skip: page * limit, take: limit });
  }

  // Assign puzzle to collection: idempotent, prevents duplicates and updates total_puzzles
  async assignPuzzleToCollection(puzzle_id: string, collection_id: string, order_index = 0) {
    const exists = await this.puzzleCollectionRepo.findOneBy({ puzzle_id, collection_id });
    if (exists) return exists;

    const pc = this.puzzleCollectionRepo.create({ puzzle_id, collection_id, order_index });
    await this.puzzleCollectionRepo.save(pc);

    // update total_puzzles for all existing progress rows for the collection
    const total = await this.puzzleCollectionRepo.countBy({ collection_id });
    await this.userCollectionProgressRepo.createQueryBuilder()
      .update()
      .set({
        total_puzzles: total,
        progress_percentage: () => "CASE WHEN total_puzzles=0 THEN 0 ELSE (completed_puzzles_count * 100.0 / total_puzzles) END",
      })
      .where('collection_id = :collection_id', { collection_id })
      .execute();

    return pc;
  }

  // Called when a user completes a puzzle.
  // Idempotent: insert into user_puzzle_completion with primary key ensures single record.
  // Transactional: updates progress and triggers reward in same transaction.
  async handlePuzzleCompletion(user_id: string, puzzle_id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // insert completion (idempotent due to PK)
      try {
        await queryRunner.manager.insert(UserPuzzleCompletion, { user_id, puzzle_id });
      } catch (err) {
        // duplicate key - already completed; proceed idempotently
      }

      // find collections that include this puzzle
      const pcols: PuzzleCollection[] = await queryRunner.manager.find(PuzzleCollection, { where: { puzzle_id } });

      for (const pc of pcols) {
        const collection = await queryRunner.manager.findOne(CollectionEntity, { where: { id: pc.collection_id } });
        // ensure progress row exists
        let progress = await queryRunner.manager.findOne(UserCollectionProgress, { where: { user_id, collection_id: pc.collection_id } });
        const totalPuzzles = await queryRunner.manager.count(PuzzleCollection, { where: { collection_id: pc.collection_id } });
        if (!progress) {
          progress = queryRunner.manager.create(UserCollectionProgress, {
            user_id,
            collection_id: pc.collection_id,
            completed_puzzles_count: 0,
            total_puzzles: totalPuzzles,
            progress_percentage: 0,
            is_completed: false,
            reward_claimed: false,
          });
          await queryRunner.manager.save(progress);
        } else if (progress.total_puzzles !== totalPuzzles) {
          progress.total_puzzles = totalPuzzles;
        }

        // recompute completed count from source of truth
        const completedCount = await queryRunner.manager.count(UserPuzzleCompletion, { where: { user_id, puzzle_id: undefined } as any });
        // above is generic count; instead count by joining puzzle_collection to user_puzzle_completion
        const completedForCollection = await queryRunner.query(
          `SELECT COUNT(1) AS cnt FROM puzzle_collection pc JOIN user_puzzle_completion upc ON pc.puzzle_id = upc.puzzle_id WHERE pc.collection_id = $1 AND upc.user_id = $2`,
          [pc.collection_id, user_id],
        );
        const cnt = parseInt(completedForCollection[0]?.cnt || '0', 10);
        progress.completed_puzzles_count = cnt;
        progress.progress_percentage = progress.total_puzzles > 0 ? Number(((cnt / progress.total_puzzles) * 100).toFixed(2)) : 0;

        if (!progress.is_completed && progress.completed_puzzles_count === progress.total_puzzles && progress.total_puzzles > 0) {
          progress.is_completed = true;
          progress.completed_at = new Date();
        }

        await queryRunner.manager.save(progress);

        // If just completed, dispatch reward (only once)
        if (progress.is_completed && !progress.reward_claimed) {
          await this.rewardService.dispatchReward(user_id, collection, queryRunner);
          progress.reward_claimed = true;
          await queryRunner.manager.save(progress);
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getFeaturedCollections(page = 0, limit = 20) {
    return this.collectionsRepo.find({ where: { is_featured: true }, skip: page * limit, take: limit });
  }

  async searchCollections(q?: string, category?: string, difficulty?: number, reward_type?: string, page = 0, limit = 20) {
    const qb = this.collectionsRepo.createQueryBuilder('c');
    if (q) qb.andWhere("(lower(c.title) LIKE :q OR lower(c.description) LIKE :q)", { q: `%${q.toLowerCase()}%` });
    if (category) qb.andWhere('c.category_id = :category', { category });
    if (difficulty) qb.andWhere('c.difficulty = :difficulty', { difficulty });
    if (reward_type) qb.andWhere('c.reward_type = :reward_type', { reward_type });
    qb.skip(page * limit).take(limit);
    return qb.getMany();
  }

  async getCollectionsByCategory(category_id: string, page = 0, limit = 20) {
    return this.collectionsRepo.find({ where: { category_id }, skip: page * limit, take: limit });
  }

  async getCollectionWithProgress(collection_id: string, user_id?: string) {
    const collection = await this.collectionsRepo.findOneBy({ id: collection_id });
    if (!user_id) return { collection };
    const progress = await this.userCollectionProgressRepo.findOneBy({ user_id, collection_id });
    return { collection, progress };
  }

  // Category management helpers
  async createCategory(dto: Partial<Category>) {
    const cat = this.categoriesRepo.create(dto as any);
    return this.categoriesRepo.save(cat);
  }

  async listCategories(page = 0, limit = 50) {
    return this.categoriesRepo.find({ skip: page * limit, take: limit });
  }

  async getCategoryById(id: string) {
    return this.categoriesRepo.findOneBy({ id });
  }

  async updateCategory(id: string, dto: Partial<Category>) {
    await this.categoriesRepo.update(id, dto as any);
    return this.categoriesRepo.findOneBy({ id });
  }

  async deleteCategory(id: string) {
    return this.categoriesRepo.delete(id);
  }
}
