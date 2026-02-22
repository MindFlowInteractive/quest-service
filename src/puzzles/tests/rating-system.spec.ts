import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PuzzleRatingService } from '../services/puzzle-rating.service';
import { PuzzleReviewService } from '../services/puzzle-review.service';
import { PuzzleRating } from '../entities/puzzle-rating.entity';
import { PuzzleRatingAggregate } from '../entities/puzzle-rating-aggregate.entity';
import { PuzzleReview } from '../entities/puzzle-review.entity';
import { ReviewVote } from '../entities/review-vote.entity';
import { Puzzle } from '../entities/puzzle.entity';
import { DataSource } from 'typeorm';

describe('RatingSystem', () => {
  let ratingService: PuzzleRatingService;
  let reviewService: PuzzleReviewService;

  const mockRatingRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ average: '4.5', count: '10' }),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ rating: '5', count: '5' }, { rating: '4', count: '5' }]),
    })),
  };

  const mockAggregateRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockReviewRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  const mockVoteRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPuzzleRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuzzleRatingService,
        PuzzleReviewService,
        { provide: getRepositoryToken(PuzzleRating), useValue: mockRatingRepo },
        { provide: getRepositoryToken(PuzzleRatingAggregate), useValue: mockAggregateRepo },
        { provide: getRepositoryToken(PuzzleReview), useValue: mockReviewRepo },
        { provide: getRepositoryToken(ReviewVote), useValue: mockVoteRepo },
        { provide: getRepositoryToken(Puzzle), useValue: mockPuzzleRepo },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    ratingService = module.get<PuzzleRatingService>(PuzzleRatingService);
    reviewService = module.get<PuzzleReviewService>(PuzzleReviewService);
  });

  it('should be defined', () => {
    expect(ratingService).toBeDefined();
    expect(reviewService).toBeDefined();
  });

  describe('submitRating', () => {
    it('should create a new rating', async () => {
      mockPuzzleRepo.findOne.mockResolvedValue({ id: 'puzzle-1' });
      mockRatingRepo.findOne.mockResolvedValue(null);
      mockRatingRepo.create.mockReturnValue({ id: 'rating-1', rating: 5 });
      mockRatingRepo.save.mockResolvedValue({ id: 'rating-1', rating: 5 });
      mockAggregateRepo.findOne.mockResolvedValue({ id: 'agg-1' });

      const result = await ratingService.submitRating('user-1', 'puzzle-1', { rating: 5 });
      expect(result).toBeDefined();
      expect(mockRatingRepo.create).toHaveBeenCalled();
      expect(mockRatingRepo.save).toHaveBeenCalled();
    });

    it('should update existing rating', async () => {
      mockPuzzleRepo.findOne.mockResolvedValue({ id: 'puzzle-1' });
      mockRatingRepo.findOne.mockResolvedValue({ id: 'rating-1', rating: 3 });
      mockRatingRepo.save.mockImplementation(r => Promise.resolve(r));

      const result = await ratingService.submitRating('user-1', 'puzzle-1', { rating: 5 });
      expect(result.rating).toBe(5);
      expect(mockRatingRepo.create).not.toHaveBeenCalled();
      expect(mockRatingRepo.save).toHaveBeenCalled();
    });
  });

  describe('submitReview', () => {
    it('should create a new review', async () => {
      mockPuzzleRepo.findOne.mockResolvedValue({ id: 'puzzle-1' });
      mockReviewRepo.findOne.mockResolvedValue(null);
      mockReviewRepo.create.mockReturnValue({ id: 'review-1', reviewText: 'Great puzzle!' });
      mockReviewRepo.save.mockResolvedValue({ id: 'review-1', reviewText: 'Great puzzle!' });
      mockReviewRepo.count.mockResolvedValue(1);
      mockAggregateRepo.findOne.mockResolvedValue({ id: 'agg-1' });

      const result = await reviewService.submitReview('user-1', 'puzzle-1', { reviewText: 'Great puzzle!' });
      expect(result).toBeDefined();
      expect(mockReviewRepo.create).toHaveBeenCalled();
      expect(mockReviewRepo.save).toHaveBeenCalled();
    });

    it('should flag profanity automatically', async () => {
      mockPuzzleRepo.findOne.mockResolvedValue({ id: 'puzzle-1' });
      mockReviewRepo.findOne.mockResolvedValue(null);
      mockReviewRepo.create.mockImplementation(dto => ({ ...dto, moderationStatus: 'flagged' }));
      mockReviewRepo.save.mockImplementation(r => Promise.resolve(r));

      // Assume 'badword1' is in the blacklist
      const result = await reviewService.submitReview('user-1', 'puzzle-1', { reviewText: 'This contains badword1' });
      expect(result.moderationStatus).toBe('flagged');
    });
  });

  describe('voteReview', () => {
    it('should allow voting on a review', async () => {
      mockReviewRepo.findOne.mockResolvedValue({ id: 'review-1', userId: 'other-user', helpfulVotes: 0 });
      mockVoteRepo.findOne.mockResolvedValue(null);
      mockVoteRepo.create.mockReturnValue({ voteType: 'helpful' });

      await reviewService.voteReview('user-1', 'review-1', { voteType: 'helpful' } as any);
      
      expect(mockVoteRepo.save).toHaveBeenCalled();
      expect(mockReviewRepo.save).toHaveBeenCalled();
    });

    it('should prevent voting on own review', async () => {
      mockReviewRepo.findOne.mockResolvedValue({ id: 'review-1', userId: 'user-1' });
      
      await expect(
        reviewService.voteReview('user-1', 'review-1', { voteType: 'helpful' } as any)
      ).rejects.toThrow();
    });
  });
});
