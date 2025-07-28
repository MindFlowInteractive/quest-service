import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  SelectQueryBuilder,
  In,
  ILike,
  Between,
  IsNull,
  Not,
} from 'typeorm';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleProgress } from '../game-logic/entities/puzzle-progress.entity';
// import { PuzzleRating } from '../leaderboard/entities/puzzle-rating.entity';
import {
  CreatePuzzleDto,
  UpdatePuzzleDto,
  SearchPuzzleDto,
  BulkUpdateDto,
  ExportPuzzleDto,
  ImportPuzzleDto,
  BulkAction,
  SortBy,
  SortOrder,
  PuzzleDifficulty,
} from './dto';

export interface PuzzleWithStats
  extends Omit<Puzzle, 'averageRating' | 'averageCompletionTime'> {
  totalPlays?: number;
  uniquePlayers?: number;
  completionRate?: number;
  averageRating?: number;
  averageCompletionTime?: number;
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
    // @InjectRepository(PuzzleRating)
    // private ratingRepository: Repository<PuzzleRating>,
  ) {}

  async create(
    createPuzzleDto: CreatePuzzleDto,
    createdBy: string,
  ): Promise<Puzzle> {
    try {
      // Validate prerequisites if provided
      if (createPuzzleDto.prerequisites?.length) {
        const prereqCount = await this.puzzleRepository.count({
          where: { id: In(createPuzzleDto.prerequisites) },
        });
        if (prereqCount !== createPuzzleDto.prerequisites.length) {
          throw new BadRequestException(
            'One or more prerequisite puzzles not found',
          );
        }
      }

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
        // publishedAt: undefined, // Not published initially - leaving as undefined
        analytics: {
          completionRate: 0,
          averageAttempts: 0,
          commonErrors: [],
          timeDistribution: {
            min: 0,
            max: 0,
            median: 0,
            q1: 0,
            q3: 0,
          },
        },
        metadata: {
          version: '1.0',
          lastModifiedBy: createdBy,
          reviewStatus: 'pending' as const,
        },
      };

      const puzzle = this.puzzleRepository.create(puzzleData);
      const savedPuzzle = await this.puzzleRepository.save(puzzle);
      this.logger.log(
        `Created puzzle: ${savedPuzzle.id} by user: ${createdBy}`,
      );

      return savedPuzzle;
    } catch (error) {
      this.logger.error(
        `Failed to create puzzle: ${error.message}`,
        error.stack,
      );
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
        sortOrder = SortOrder.DESC,
      } = searchDto;

      const queryBuilder = this.puzzleRepository
        .createQueryBuilder('puzzle')
        .leftJoinAndSelect('puzzle.progress', 'progress')
        .where('puzzle.deletedAt IS NULL'); // Only active puzzles

      // Apply filters
      if (search) {
        queryBuilder.andWhere(
          '(puzzle.title ILIKE :search OR puzzle.description ILIKE :search OR puzzle.tags::text ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      if (category) {
        queryBuilder.andWhere('puzzle.category = :category', { category });
      }

      if (difficulty) {
        queryBuilder.andWhere('puzzle.difficulty = :difficulty', {
          difficulty,
        });
      }

      if (minRating !== undefined) {
        queryBuilder.andWhere('puzzle.difficultyRating >= :minRating', {
          minRating,
        });
      }

      if (maxRating !== undefined) {
        queryBuilder.andWhere('puzzle.difficultyRating <= :maxRating', {
          maxRating,
        });
      }

      if (tags?.length) {
        queryBuilder.andWhere('puzzle.tags && ARRAY[:...tags]', { tags });
      }

      if (isFeatured !== undefined) {
        queryBuilder.andWhere('puzzle.isFeatured = :isFeatured', {
          isFeatured,
        });
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
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(
        `Failed to search puzzles: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(id: string, userId?: string): Promise<PuzzleWithStats> {
    try {
      const puzzle = await this.puzzleRepository
        .createQueryBuilder('puzzle')
        .leftJoinAndSelect('puzzle.progress', 'progress')
        .leftJoinAndSelect('puzzle.prerequisites', 'prerequisites')
        .leftJoinAndSelect('puzzle.childPuzzles', 'childPuzzles')
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
      this.logger.error(
        `Failed to find puzzle ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async update(
    id: string,
    updatePuzzleDto: UpdatePuzzleDto,
    userId: string,
  ): Promise<PuzzleWithStats> {
    try {
      const puzzle = await this.findOne(id, userId);

      if (puzzle.createdBy !== userId) {
        throw new BadRequestException(
          'You can only update puzzles you created',
        );
      }

      // Handle publish/unpublish
      const updateData: any = { ...updatePuzzleDto };
      if (updateData.isPublished !== undefined) {
        updateData.publishedAt = updateData.isPublished ? new Date() : null;
        delete updateData.isPublished;
      }

      // Update metadata
      const currentMetadata = puzzle.metadata || {};
      updateData.metadata = {
        ...currentMetadata,
        lastModifiedBy: userId,
        version: this.incrementVersion(currentMetadata.version || '1.0'),
      };

      await this.puzzleRepository.update(id, updateData);

      const updatedPuzzle = await this.findOne(id, userId);
      this.logger.log(`Updated puzzle: ${id}`);

      return updatedPuzzle;
    } catch (error) {
      this.logger.error(
        `Failed to update puzzle ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const puzzle = await this.findOne(id, userId);

      if (puzzle.createdBy !== userId) {
        throw new BadRequestException(
          'You can only delete puzzles you created',
        );
      }

      // Check if puzzle has any progress - always soft delete
      await this.puzzleRepository.softDelete(id);
      this.logger.log(`Soft deleted puzzle: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to remove puzzle ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async bulkUpdate(
    puzzleIds: string[],
    bulkUpdateDto: BulkUpdateDto,
    userId: string,
  ): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    try {
      // Verify user owns all puzzles
      const puzzles = await this.puzzleRepository.find({
        where: { id: In(puzzleIds), createdBy: userId },
      });

      if (puzzles.length !== puzzleIds.length) {
        throw new BadRequestException(
          'You can only bulk update puzzles you created',
        );
      }

      for (const puzzleId of puzzleIds) {
        try {
          await this.executeBulkAction(puzzleId, bulkUpdateDto, userId);
          updated++;
        } catch (error) {
          errors.push(`${puzzleId}: ${error.message}`);
        }
      }

      this.logger.log(
        `Bulk update completed: ${updated} updated, ${errors.length} errors`,
      );
      return { updated, errors };
    } catch (error) {
      this.logger.error(`Bulk update failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAnalytics(period: string = 'all'): Promise<PuzzleAnalytics> {
    try {
      const baseQuery = this.puzzleRepository
        .createQueryBuilder('puzzle')
        .where('puzzle.deletedAt IS NULL');

      // Apply date filter
      if (period !== 'all') {
        const date = this.getDateFromPeriod(period);
        baseQuery.andWhere('puzzle.createdAt >= :date', { date });
      }

      const [
        totalPuzzles,
        publishedPuzzles,
        categoryResults,
        difficultyResults,
        ratingResult,
        topPuzzles,
      ] = await Promise.all([
        baseQuery.getCount(),
        baseQuery.clone().andWhere('puzzle.publishedAt IS NOT NULL').getCount(),
        baseQuery
          .clone()
          .select('puzzle.category, COUNT(*) as count')
          .groupBy('puzzle.category')
          .getRawMany(),
        baseQuery
          .clone()
          .select('puzzle.difficulty, COUNT(*) as count')
          .groupBy('puzzle.difficulty')
          .getRawMany(),
        baseQuery.clone().select('AVG(puzzle.averageRating)').getRawOne(),
        this.puzzleRepository.find({
          where: { deletedAt: IsNull(), publishedAt: Not(IsNull()) },
          order: { completions: 'DESC' },
          take: 10,
        }),
      ]);

      const categoryCounts = categoryResults.reduce((acc, row) => {
        acc[row.puzzle_category] = parseInt(row.count);
        return acc;
      }, {});

      const difficultyDistribution = difficultyResults.reduce(
        (acc, row) => {
          acc[row.puzzle_difficulty as PuzzleDifficulty] = parseInt(row.count);
          return acc;
        },
        {} as { [key in PuzzleDifficulty]: number },
      );

      return {
        totalPuzzles,
        publishedPuzzles,
        categoryCounts,
        difficultyDistribution,
        averageRating: parseFloat(ratingResult.avg || '0'),
        topPerformingPuzzles: topPuzzles,
        recentActivity: await this.getRecentActivity(period),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get analytics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Private helper methods
  private applySorting(
    queryBuilder: SelectQueryBuilder<Puzzle>,
    sortBy: SortBy,
    sortOrder: SortOrder,
  ): void {
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

  private async enhanceWithStats(
    puzzles: Puzzle[],
  ): Promise<PuzzleWithStats[]> {
    if (!puzzles.length) return [];

    const puzzleIds = puzzles.map((p) => p.id);

    // Get play statistics
    const playStats = await this.progressRepository
      .createQueryBuilder('progress')
      .select([
        'puzzleId',
        'COUNT(*) as totalPlays',
        'COUNT(DISTINCT userId) as uniquePlayers',
        'COUNT(CASE WHEN isCompleted = true THEN 1 END) as completions',
        'AVG(CASE WHEN completionTime IS NOT NULL THEN completionTime END) as avgTime',
      ])
      .where('puzzleId IN (:...puzzleIds)', { puzzleIds })
      .groupBy('puzzleId')
      .getRawMany();

    // Get rating statistics - commented out since PuzzleRating is not available
    // const ratingStats = await this.ratingRepository
    //   .createQueryBuilder('rating')
    //   .select([
    //     'puzzleId',
    //     'AVG(rating) as averageRating'
    //   ])
    //   .where('puzzleId IN (:...puzzleIds)', { puzzleIds })
    //   .groupBy('puzzleId')
    //   .getRawMany();

    // Create lookup maps
    const playStatsMap = new Map(
      playStats.map((stat) => [stat.puzzleId, stat]),
    );
    // const ratingStatsMap = new Map(ratingStats.map(stat => [stat.puzzleId, stat]));

    return puzzles.map((puzzle) => {
      const playData = playStatsMap.get(puzzle.id);
      // const ratingData = ratingStatsMap.get(puzzle.id);

      return {
        ...puzzle,
        totalPlays: playData ? parseInt(playData.totalPlays) : puzzle.attempts,
        uniquePlayers: playData ? parseInt(playData.uniquePlayers) : 0,
        completionRate:
          playData && parseInt(playData.totalPlays) > 0
            ? (parseInt(playData.completions) / parseInt(playData.totalPlays)) *
              100
            : 0,
        averageRating: puzzle.averageRating,
        averageCompletionTime: playData
          ? parseFloat(playData.avgTime || '0')
          : puzzle.averageCompletionTime,
      };
    });
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[parts.length - 1] || '0');
    parts[parts.length - 1] = (patch + 1).toString();
    return parts.join('.');
  }

  private async executeBulkAction(
    puzzleId: string,
    bulkUpdateDto: BulkUpdateDto,
    userId: string,
  ): Promise<void> {
    const { action, value } = bulkUpdateDto;

    switch (action) {
      case BulkAction.PUBLISH:
        await this.puzzleRepository.update(puzzleId, {
          publishedAt: new Date(),
        });
        break;
      case BulkAction.UNPUBLISH:
        await this.puzzleRepository.update(puzzleId, {
          publishedAt: undefined,
        });
        break;
      case BulkAction.ARCHIVE:
        await this.puzzleRepository.softDelete(puzzleId);
        break;
      case BulkAction.UPDATE_CATEGORY:
        if (!value) throw new BadRequestException('Category value required');
        await this.puzzleRepository.update(puzzleId, { category: value });
        break;
      case BulkAction.ADD_TAGS:
        if (!value) throw new BadRequestException('Tags value required');
        const tagsToAdd = value.split(',').map((t) => t.trim());
        const puzzle = await this.puzzleRepository.findOne({
          where: { id: puzzleId },
        });
        if (!puzzle) throw new NotFoundException('Puzzle not found');
        const updatedTags = [
          ...new Set([...(puzzle.tags || []), ...tagsToAdd]),
        ];
        await this.puzzleRepository.update(puzzleId, { tags: updatedTags });
        break;
      case BulkAction.REMOVE_TAGS:
        if (!value) throw new BadRequestException('Tags value required');
        const tagsToRemove = value.split(',').map((t) => t.trim());
        const currentPuzzle = await this.puzzleRepository.findOne({
          where: { id: puzzleId },
        });
        if (!currentPuzzle) throw new NotFoundException('Puzzle not found');
        const filteredTags = (currentPuzzle.tags || []).filter(
          (tag) => !tagsToRemove.includes(tag),
        );
        await this.puzzleRepository.update(puzzleId, { tags: filteredTags });
        break;
      default:
        throw new BadRequestException(`Unsupported bulk action: ${action}`);
    }
  }

  private getDateFromPeriod(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0);
    }
  }

  private async getRecentActivity(period: string) {
    const date = this.getDateFromPeriod(period);

    const [created, published, played] = await Promise.all([
      this.puzzleRepository.count({
        where: {
          createdAt: Between(date, new Date()),
          deletedAt: IsNull(),
        },
      }),
      this.puzzleRepository.count({
        where: {
          publishedAt: Not(IsNull()),
          createdAt: Between(date, new Date()),
          deletedAt: IsNull(),
        },
      }),
      this.progressRepository.count({
        where: { createdAt: Between(date, new Date()) },
      }),
    ]);

    return { created, published, played };
  }
}
