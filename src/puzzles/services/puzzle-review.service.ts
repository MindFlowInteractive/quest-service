import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleReview } from '../entities/puzzle-review.entity';
import { ReviewVote } from '../entities/review-vote.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { VoteReviewDto, VoteType } from '../dto/vote-review.dto';
import { FlagReviewDto } from '../dto/flag-review.dto';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleRatingAggregate } from '../entities/puzzle-rating-aggregate.entity';

@Injectable()
export class PuzzleReviewService {
  constructor(
    @InjectRepository(PuzzleReview)
    private readonly reviewRepository: Repository<PuzzleReview>,
    @InjectRepository(ReviewVote)
    private readonly voteRepository: Repository<ReviewVote>,
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(PuzzleRatingAggregate)
    private readonly aggregateRepository: Repository<PuzzleRatingAggregate>,
  ) {}

  async submitReview(userId: string, puzzleId: string, createReviewDto: CreateReviewDto): Promise<PuzzleReview> {
    const puzzle = await this.puzzleRepository.findOne({ where: { id: puzzleId } });
    if (!puzzle) {
      throw new NotFoundException('Puzzle not found');
    }

    // Check if user already reviewed
    const existingReview = await this.reviewRepository.findOne({
      where: { userId, puzzleId },
    });

    if (existingReview) {
      throw new ForbiddenException('User has already reviewed this puzzle');
    }

    // Simple profanity filter (placeholder)
    const moderationStatus = this.checkProfanity(createReviewDto.reviewText) ? 'flagged' : 'pending';

    const review = this.reviewRepository.create({
      userId,
      puzzleId,
      reviewText: createReviewDto.reviewText,
      moderationStatus: moderationStatus, // Default to pending, or flagged if bad words found
    });

    const savedReview = await this.reviewRepository.save(review);
    
    // Update aggregate count
    await this.updateReviewCount(puzzleId);

    return savedReview;
  }

  async updateReview(userId: string, reviewId: string, updateReviewDto: UpdateReviewDto): Promise<PuzzleReview> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own review');
    }

    review.reviewText = updateReviewDto.reviewText;
    review.moderationStatus = 'pending'; // Reset moderation status on edit
    
    // Check profanity again
    if (this.checkProfanity(updateReviewDto.reviewText)) {
        review.moderationStatus = 'flagged';
    }

    return this.reviewRepository.save(review);
  }

  async deleteReview(userId: string, reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Allow admin or owner to delete (assuming admin check is done in controller/guard)
    if (review.userId !== userId) {
        // In a real app, we'd check roles here too
        throw new ForbiddenException('You can only delete your own review');
    }

    await this.reviewRepository.softDelete(reviewId);
    
    // Update aggregate count
    await this.updateReviewCount(review.puzzleId);
  }

  async voteReview(userId: string, reviewId: string, voteDto: VoteReviewDto): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId === userId) {
      throw new ForbiddenException('Cannot vote on your own review');
    }

    let vote = await this.voteRepository.findOne({
      where: { userId, reviewId },
    });

    if (vote) {
      // Update existing vote
      if (vote.voteType !== voteDto.voteType) {
        // Decrease old count
        if (vote.voteType === VoteType.HELPFUL) review.helpfulVotes--;
        else review.unhelpfulVotes--;

        // Update vote
        vote.voteType = voteDto.voteType;
        
        // Increase new count
        if (vote.voteType === VoteType.HELPFUL) review.helpfulVotes++;
        else review.unhelpfulVotes++;
      }
    } else {
      // Create new vote
      vote = this.voteRepository.create({
        userId,
        reviewId,
        voteType: voteDto.voteType,
      });

      if (voteDto.voteType === VoteType.HELPFUL) review.helpfulVotes++;
      else review.unhelpfulVotes++;
    }

    await this.voteRepository.save(vote);
    await this.reviewRepository.save(review);
  }

  async flagReview(userId: string, reviewId: string, flagDto: FlagReviewDto): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isFlagged = true;
    review.flagReason = flagDto.reason;
    review.moderationStatus = 'flagged';
    
    await this.reviewRepository.save(review);
  }

  async getPuzzleReviews(puzzleId: string, page: number = 1, limit: number = 20, sort: 'recency' | 'helpful' = 'recency'): Promise<{ reviews: PuzzleReview[], total: number }> {
    const query = this.reviewRepository.createQueryBuilder('review')
      .where('review.puzzleId = :puzzleId', { puzzleId })
      .andWhere('review.moderationStatus IN (:...statuses)', { statuses: ['approved', 'pending'] }) // Only show approved or pending
      .leftJoinAndSelect('review.user', 'user')
      .skip((page - 1) * limit)
      .take(limit);

    if (sort === 'helpful') {
      query.orderBy('review.helpfulVotes', 'DESC');
    } else {
      query.orderBy('review.createdAt', 'DESC');
    }

    const [reviews, total] = await query.getManyAndCount();
    return { reviews, total };
  }

  private async updateReviewCount(puzzleId: string): Promise<void> {
      const count = await this.reviewRepository.count({
          where: { puzzleId, deletedAt: null }
      });

      let aggregate = await this.aggregateRepository.findOne({ where: { puzzleId } });
      if (!aggregate) {
          aggregate = this.aggregateRepository.create({ puzzleId });
      }
      
      aggregate.totalReviews = count;
      await this.aggregateRepository.save(aggregate);
  }

  private checkProfanity(text: string): boolean {
      const badWords = ['badword1', 'badword2']; // Placeholder
      return badWords.some(word => text.toLowerCase().includes(word));
  }
}
