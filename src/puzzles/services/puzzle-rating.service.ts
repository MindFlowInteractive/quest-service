import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PuzzleRating } from '../entities/puzzle-rating.entity';
import { PuzzleRatingAggregate } from '../entities/puzzle-rating-aggregate.entity';
import { CreateRatingDto } from '../dto/create-rating.dto';
import { Puzzle } from '../entities/puzzle.entity';

@Injectable()
export class PuzzleRatingService {
  constructor(
    @InjectRepository(PuzzleRating)
    private readonly ratingRepository: Repository<PuzzleRating>,
    @InjectRepository(PuzzleRatingAggregate)
    private readonly aggregateRepository: Repository<PuzzleRatingAggregate>,
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    private readonly dataSource: DataSource,
  ) {}

  async submitRating(userId: string, puzzleId: string, createRatingDto: CreateRatingDto): Promise<PuzzleRating> {
    const puzzle = await this.puzzleRepository.findOne({ where: { id: puzzleId } });
    if (!puzzle) {
      throw new NotFoundException('Puzzle not found');
    }

    // Check for existing rating
    let rating = await this.ratingRepository.findOne({
      where: { userId, puzzleId },
    });

    if (rating) {
      // Update existing rating
      rating.rating = createRatingDto.rating;
      if (createRatingDto.difficultyVote) {
        rating.difficultyVote = createRatingDto.difficultyVote;
      }
      if (createRatingDto.tags) {
        rating.tags = createRatingDto.tags;
      }
      rating.updatedAt = new Date();
    } else {
      // Create new rating
      rating = this.ratingRepository.create({
        userId,
        puzzleId,
        rating: createRatingDto.rating,
        difficultyVote: createRatingDto.difficultyVote,
        tags: createRatingDto.tags || [],
      });
    }

    const savedRating = await this.ratingRepository.save(rating);

    // Trigger aggregation in background
    this.updateAggregate(puzzleId);

    return savedRating;
  }

  async getPuzzleRating(userId: string, puzzleId: string): Promise<PuzzleRating> {
    const rating = await this.ratingRepository.findOne({
      where: { userId, puzzleId },
    });
    if (!rating) {
      throw new NotFoundException('Rating not found');
    }
    return rating;
  }

  async getPuzzleAggregate(puzzleId: string): Promise<PuzzleRatingAggregate> {
    let aggregate = await this.aggregateRepository.findOne({
      where: { puzzleId },
    });

    if (!aggregate) {
      // Create initial aggregate if not exists
      aggregate = await this.updateAggregate(puzzleId);
    }

    return aggregate;
  }

  private async updateAggregate(puzzleId: string): Promise<PuzzleRatingAggregate> {
    // Calculate aggregates using a query builder or raw query for efficiency
    const result = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'average')
      .addSelect('COUNT(rating.id)', 'count')
      .where('rating.puzzleId = :puzzleId', { puzzleId })
      .getRawOne();

    const averageRating = parseFloat(result.average) || 0;
    const totalRatings = parseInt(result.count, 10) || 0;

    // Calculate distribution
    const distributionResult = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('rating.rating', 'rating')
      .addSelect('COUNT(rating.id)', 'count')
      .where('rating.puzzleId = :puzzleId', { puzzleId })
      .groupBy('rating.rating')
      .getRawMany();

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distributionResult.forEach((row) => {
      const score = Math.round(parseFloat(row.rating));
      if (distribution[score] !== undefined) {
        distribution[score] = parseInt(row.count, 10);
      }
    });

    // Update or create aggregate
    let aggregate = await this.aggregateRepository.findOne({
      where: { puzzleId },
    });

    if (!aggregate) {
      aggregate = this.aggregateRepository.create({
        puzzleId,
      });
    }

    aggregate.averageRating = averageRating;
    aggregate.totalRatings = totalRatings;
    aggregate.ratingDistribution = distribution;
    
    // Also update total reviews count from reviews table if needed, 
    // but we can do that in the ReviewService or here if we inject the review repo.
    // For now, let's keep it simple.

    await this.aggregateRepository.save(aggregate);

    // Also update the denormalized fields on Puzzle entity for quick access
    await this.puzzleRepository.update(puzzleId, {
        averageRating: averageRating,
        ratingCount: totalRatings
    });

    return aggregate;
  }
}
