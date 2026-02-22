import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, Between, IsNull, Not, Brackets } from 'typeorm';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleProgress } from '../game-logic/entities/puzzle-progress.entity';
import { PuzzleRating } from './entities/puzzle-rating.entity';
import { 
  CreatePuzzleDto, 
  UpdatePuzzleDto, 
  SearchPuzzleDto, 
  BulkUpdateDto,
  BulkAction,
  SortBy,
  SortOrder,
  PuzzleDifficulty 
} from './dto';

export interface PuzzleWithStats {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  difficultyRating: number;
  basePoints: number;
  timeLimit: number;
  maxHints: number;
  attempts: number;
  completions: number;
  averageRating: number;
  ratingCount: number;
  averageCompletionTime: number;
  isActive: boolean;
  isFeatured: boolean;
  publishedAt?: Date;
  createdBy?: string;
  content: any;
  hints: any[];
  tags: string[];
  prerequisites: string[];
  scoring: any;
  analytics: any;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  progress?: any[];
  parentPuzzle?: any;
  childPuzzles?: any[];
  totalPlays?: number;
  uniquePlayers?: number;
  completionRate?: number;
}

export interface SearchResult {
  puzzles: PuzzleWithStats[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PuzzleAnalytics {
  totalPuzzles: number;
  publishedPuzzles: number;
  categoryCounts: { [key: string]: number };
  difficultyDistribution: { [key in PuzzleDifficulty]: number };
  averageRating: number;
  topPerformingPuzzles: Puzzle[];
  recentActivity: {
    created: number;
    published: number;
    played: number;
  };
}

@Injectable()
export class PuzzlesService {
  private readonly logger = new Logger(PuzzlesService.name);

  constructor(
    @InjectRepository(Puzzle)
    private puzzleRepository: Repository<Puzzle>,
    @InjectRepository(PuzzleProgress)
    private progressRepository: Repository<PuzzleProgress>,
    @InjectRepository(PuzzleRating)
    private ratingRepository: Repository<PuzzleRating>,
  ) {}

  async create(createPuzzleDto: CreatePuzzleDto, createdBy: string): Promise<Puzzle> {
    try {
      const puzzleData = {
        title: createPuzzleDto.title,
        description: createPuzzleDto.description,
        category: createPuzzleDto.category,
        difficulty: createPuzzleDto.difficulty,
        difficultyRating: createPuzzleDto.difficultyRating,
        basePoints: createPuzzleDto.basePoints,
        timeLimit: createPuzzleDto.timeLimit,
        maxHints: createPuzzleDto.maxHints,
        content: createPuzzleDto.content,
        hints: createPuzzleDto.hints || [],
        tags: createPuzzleDto.tags || [],
        prerequisites: createPuzzleDto.prerequisites || [],
        scoring: createPuzzleDto.scoring || {},
        isFeatured: createPuzzleDto.isFeatured || false,
        createdBy,
        publishedAt: undefined, // Not published initially
        analytics: {
          completionRate: 0,
          averageAttempts: 0,
          commonErrors: [],
          timeDistribution: {
            min: 0,
            max: 0,
            median: 0,
            q1: 0,
            q3: 0
          }
        },
        metadata: {
          version: '1.0',
          lastModifiedBy: createdBy,
          reviewStatus: 'pending' as const
        }
      };

      const puzzle = this.puzzleRepository.create(puzzleData);
      const savedPuzzle = await this.puzzleRepository.save(puzzle);
      this.logger.log(`Created puzzle: ${savedPuzzle.id} by user: ${createdBy}`);
      
      return savedPuzzle;
    } catch (error) {
      this.logger.error(`Failed to create puzzle: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(searchDto: SearchPuzzleDto): Promise<SearchResult> {
    try {
      const {
        search,
        category,
        difficulty,
        minRating,
        maxRating,
        tags,
        isFeatured,
        isPublished,
        createdBy,
        page = 1,
        limit = 20,
        sortBy = SortBy.CREATED_AT,
        sortOrder = SortOrder.DESC
      } = searchDto;

      const queryBuilder = this.puzzleRepository
        .createQueryBuilder('puzzle')
        .where('puzzle.deletedAt IS NULL');

      // Apply filters
      if (search) {
        queryBuilder.andWhere(
          '(puzzle.title ILIKE :search OR puzzle.description ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (category) {
        queryBuilder.andWhere('puzzle.category = :category', { category });
      }

      if (difficulty) {
        queryBuilder.andWhere('puzzle.difficulty = :difficulty', { difficulty });
      }

      if (minRating !== undefined) {
        queryBuilder.andWhere('puzzle.difficultyRating >= :minRating', { minRating });
      }

      if (maxRating !== undefined) {
        queryBuilder.andWhere('puzzle.difficultyRating <= :maxRating', { maxRating });
      }

      if (isFeatured !== undefined) {
        queryBuilder.andWhere('puzzle.isFeatured = :isFeatured', { isFeatured });
      }

      if (isPublished !== undefined) {
        if (isPublished) {
          queryBuilder.andWhere('puzzle.publishedAt IS NOT NULL');
        } else {
          queryBuilder.andWhere('puzzle.publishedAt IS NULL');
        }
      }

      if (createdBy) {
        queryBuilder.andWhere('puzzle.createdBy = :createdBy', { createdBy });
      }

      // Apply sorting
      this.applySorting(queryBuilder, sortBy, sortOrder);

      // Execute query with pagination
      const [puzzles, total] = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      // Enhance with statistics
      const puzzlesWithStats = await this.enhanceWithStats(puzzles);

      return {
        puzzles: puzzlesWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Failed to search puzzles: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string, userId?: string): Promise<PuzzleWithStats> {
    try {
      const puzzle = await this.puzzleRepository
        .createQueryBuilder('puzzle')
        .where('puzzle.id = :id', { id })
        .andWhere('puzzle.deletedAt IS NULL')
        .getOne();

      if (!puzzle) {
        throw new NotFoundException(`Puzzle with ID ${id} not found`);
      }

      // Check if user has access to unpublished puzzle
      if (!puzzle.publishedAt && userId !== puzzle.createdBy) {
        throw new NotFoundException(`Puzzle with ID ${id} not found`);
      }

      const [enhancedPuzzle] = await this.enhanceWithStats([puzzle]);
      return enhancedPuzzle;
    } catch (error) {
      this.logger.error(`Failed to find puzzle ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updatePuzzleDto: UpdatePuzzleDto, userId: string): Promise<PuzzleWithStats> {
    try {
      const puzzle = await this.findOne(id, userId);

      if (puzzle.createdBy !== userId) {
        throw new BadRequestException('You can only update puzzles you created');
      }

      // Handle publish/unpublish
      const updateData: any = { ...updatePuzzleDto };
      if (updateData.isPublished !== undefined) {
        updateData.publishedAt = updateData.isPublished ? new Date() : null;
        delete updateData.isPublished;
      }

      await this.puzzleRepository.update(id, updateData);
      
      const updatedPuzzle = await this.findOne(id, userId);
      this.logger.log(`Updated puzzle: ${id}`);
      
      return updatedPuzzle;
    } catch (error) {
      this.logger.error(`Failed to update puzzle ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const puzzle = await this.findOne(id, userId);

      if (puzzle.createdBy !== userId) {
        throw new BadRequestException('You can only delete puzzles you created');
      }

      await this.puzzleRepository.softDelete(id);
      this.logger.log(`Deleted puzzle: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to remove puzzle ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async bulkUpdate(puzzleIds: string[], bulkUpdateDto: BulkUpdateDto, userId: string): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    try {
      for (const puzzleId of puzzleIds) {
        try {
          await this.executeBulkAction(puzzleId, bulkUpdateDto, userId);
          updated++;
        } catch (error) {
          errors.push(`${puzzleId}: ${error.message}`);
        }
      }

      this.logger.log(`Bulk update completed: ${updated} updated, ${errors.length} errors`);
      return { updated, errors };
    } catch (error) {
      this.logger.error(`Bulk update failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAnalytics(period: string = 'all'): Promise<PuzzleAnalytics> {
    try {
      const baseQuery = this.puzzleRepository.createQueryBuilder('puzzle')
        .where('puzzle.deletedAt IS NULL');

      const [
        totalPuzzles,
        publishedPuzzles,
        topPuzzles
      ] = await Promise.all([
        baseQuery.getCount(),
        baseQuery.clone().andWhere('puzzle.publishedAt IS NOT NULL').getCount(),
        this.puzzleRepository.find({
          where: { deletedAt: IsNull(), publishedAt: Not(IsNull()) },
          order: { completions: 'DESC' },
          take: 10
        })
      ]);

      return {
        totalPuzzles,
        publishedPuzzles,
        categoryCounts: {},
        difficultyDistribution: {} as any,
        averageRating: 0,
        topPerformingPuzzles: topPuzzles,
        recentActivity: {
          created: 0,
          published: 0,
          played: 0
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get analytics: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getRecommendations(userId: string, limit: number = 5): Promise<PuzzleWithStats[]> {
    try {
      // 1. Get user's top rated puzzles
      const topRatings = await this.ratingRepository.find({
        where: { userId, rating: Between(4, 5) },
        relations: ['puzzle'],
        take: 10,
        order: { createdAt: 'DESC' }
      });

      if (topRatings.length === 0) {
        // Fallback to trending/popular puzzles
        const trending = await this.findAll({ 
            limit, 
            sortBy: SortBy.PLAYS, 
            sortOrder: SortOrder.DESC,
            isPublished: true 
        } as SearchPuzzleDto);
        return trending.puzzles;
      }

      // 2. Extract categories and tags
      const categories = new Set<string>();
      const tags = new Set<string>();
      const playedPuzzleIds = new Set<string>();

      topRatings.forEach(r => {
        if (r.puzzle) {
            categories.add(r.puzzle.category);
            r.puzzle.tags.forEach(t => tags.add(t));
            playedPuzzleIds.add(r.puzzle.id);
        }
      });

      // 3. Find similar puzzles
      const queryBuilder = this.puzzleRepository.createQueryBuilder('puzzle')
        .where('puzzle.deletedAt IS NULL')
        .andWhere('puzzle.publishedAt IS NOT NULL')
        .andWhere('puzzle.id NOT IN (:...playedIds)', { playedIds: Array.from(playedPuzzleIds).length > 0 ? Array.from(playedPuzzleIds) : ['00000000-0000-0000-0000-000000000000'] })
        .andWhere(new Brackets(qb => {
            if (categories.size > 0) {
                qb.where('puzzle.category IN (:...categories)', { categories: Array.from(categories) });
            }
        }))
        .orderBy('puzzle.averageRating', 'DESC')
        .take(limit);

      const puzzles = await queryBuilder.getMany();
      return this.enhanceWithStats(puzzles);
    } catch (error) {
      this.logger.error(`Failed to get recommendations: ${error.message}`, error.stack);
      return [];
    }
  }

  // Private helper methods
  private applySorting(queryBuilder: SelectQueryBuilder<Puzzle>, sortBy: SortBy, sortOrder: SortOrder): void {
    switch (sortBy) {
      case SortBy.TITLE:
        queryBuilder.orderBy('puzzle.title', sortOrder);
        break;
      case SortBy.DIFFICULTY:
        queryBuilder.orderBy('puzzle.difficultyRating', sortOrder);
        break;
      case SortBy.RATING:
        queryBuilder.orderBy('puzzle.averageRating', sortOrder);
        break;
      case SortBy.REVIEWS:
        queryBuilder.orderBy('puzzle.ratingCount', sortOrder);
        break;
      case SortBy.PLAYS:
        queryBuilder.orderBy('puzzle.attempts', sortOrder);
        break;
      case SortBy.COMPLETION_RATE:
        queryBuilder.orderBy('puzzle.completions', sortOrder);
        break;
      default:
        queryBuilder.orderBy('puzzle.createdAt', sortOrder);
    }
  }

  private async enhanceWithStats(puzzles: Puzzle[]): Promise<PuzzleWithStats[]> {
    return puzzles.map(puzzle => ({
      ...puzzle,
      totalPlays: puzzle.attempts,
      uniquePlayers: 0,
      completionRate: puzzle.attempts > 0 ? (puzzle.completions / puzzle.attempts) * 100 : 0,
      averageRating: puzzle.averageRating,
      averageCompletionTime: puzzle.averageCompletionTime
    }));
  }

  private async executeBulkAction(puzzleId: string, bulkUpdateDto: BulkUpdateDto, userId: string): Promise<void> {
    const { action, value } = bulkUpdateDto;

    switch (action) {
      case BulkAction.PUBLISH:
        await this.puzzleRepository.update(puzzleId, { publishedAt: new Date() });
        break;
      case BulkAction.UNPUBLISH:
        await this.puzzleRepository.update(puzzleId, { publishedAt: undefined });
        break;
      case BulkAction.ARCHIVE:
        await this.puzzleRepository.softDelete(puzzleId);
        break;
      default:
        throw new BadRequestException(`Unsupported bulk action: ${action}`);
    }
  }
}
