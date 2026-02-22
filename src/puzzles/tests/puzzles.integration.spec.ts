import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzlesModule } from '../puzzles.module';
import { PuzzleRatingService } from '../services/puzzle-rating.service';
import { PuzzleReviewService } from '../services/puzzle-review.service';
import { PuzzlesService } from '../puzzles.service';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleRating } from '../entities/puzzle-rating.entity';
import { PuzzleReview } from '../entities/puzzle-review.entity';
import { DataSource } from 'typeorm';
import { ReviewVote } from '../entities/review-vote.entity';
import { PuzzleRatingAggregate } from '../entities/puzzle-rating-aggregate.entity';
import { Category } from '../entities/category.entity';
import { Collection } from '../entities/collection.entity';
import { Theme } from '../entities/theme.entity';
import { PuzzleProgress } from '../../game-logic/entities/puzzle-progress.entity';
import { Events } from '../../event/entities/event.entity';
import { UserAchievement } from '../../achievements/entities/user-achievement.entity';
import { Achievement } from '../../achievements/entities/achievement.entity';
import { GameSession } from '../../game-engine/entities/game-session.entity';
import { UserStreak } from '../../users/entities/user-streak.entity';
import { UserPuzzleCompletion } from '../../users/entities/user-puzzle-completion.entity';
import { User } from '../../users/entities/user.entity';
import { PuzzleDifficulty, PuzzleContentType } from '../dto/create-puzzle.dto';

describe('Puzzles Integration Test', () => {
  let module: TestingModule;
  let ratingService: PuzzleRatingService;
  let reviewService: PuzzleReviewService;
  let puzzlesService: PuzzlesService;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            Puzzle, 
            PuzzleRating, 
            PuzzleReview, 
            ReviewVote, 
            PuzzleRatingAggregate, 
            Category, 
            Collection, 
            Theme, 
            PuzzleProgress, 
            Events, 
            User,
            UserAchievement,
            Achievement,
            GameSession,
            UserStreak,
            UserPuzzleCompletion
          ],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          Puzzle, 
          PuzzleRating, 
          PuzzleReview, 
          ReviewVote, 
          PuzzleRatingAggregate, 
          Category, 
          Collection, 
          Theme, 
          PuzzleProgress, 
          Events, 
          User,
          UserAchievement,
          Achievement,
          GameSession,
          UserStreak,
          UserPuzzleCompletion
        ])
      ],
      providers: [
        PuzzlesService,
        PuzzleRatingService,
        PuzzleReviewService,
      ],
    }).compile();

    ratingService = module.get<PuzzleRatingService>(PuzzleRatingService);
    reviewService = module.get<PuzzleReviewService>(PuzzleReviewService);
    puzzlesService = module.get<PuzzlesService>(PuzzlesService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clean up database
    await dataSource.synchronize(true);
  });

  describe('Rating System Integration', () => {
    it('should correctly aggregate ratings when multiple users rate a puzzle', async () => {
      // 1. Create a puzzle
      const puzzle = await puzzlesService.create({
        title: 'Test Puzzle',
        description: 'Test Description',
        category: 'logic',
        difficulty: PuzzleDifficulty.MEDIUM,
        difficultyRating: 5,
        basePoints: 100,
        timeLimit: 300,
        maxHints: 3,
        content: {
          type: PuzzleContentType.MULTIPLE_CHOICE,
          question: 'What is 2+2?',
          correctAnswer: '4',
          options: ['3', '4', '5']
        },
      }, 'user-creator-id');

      // 2. Submit ratings
      await ratingService.submitRating('user-1', puzzle.id, { rating: 5 });
      await ratingService.submitRating('user-2', puzzle.id, { rating: 3 });
      await ratingService.submitRating('user-3', puzzle.id, { rating: 4 });

      // 3. Verify aggregate
      const aggregate = await ratingService.getPuzzleAggregate(puzzle.id);
      expect(aggregate.totalRatings).toBe(3);
      expect(Number(aggregate.averageRating)).toBeCloseTo(4.0, 1);
      
      // 4. Verify denormalized fields on Puzzle
      const updatedPuzzle = await puzzlesService.findOne(puzzle.id, 'user-creator-id');
      expect(Number(updatedPuzzle.averageRating)).toBeCloseTo(4.0, 1);
      expect(updatedPuzzle.ratingCount).toBe(3);
    });

    it('should prevent duplicate reviews from the same user', async () => {
      const puzzle = await puzzlesService.create({
        title: 'Review Test',
        description: 'Desc',
        category: 'logic',
        difficulty: PuzzleDifficulty.EASY,
        difficultyRating: 1,
        basePoints: 10,
        timeLimit: 60,
        maxHints: 1,
        content: {
          type: PuzzleContentType.MULTIPLE_CHOICE,
          question: 'What is 1+1?',
          correctAnswer: '2',
          options: ['1', '2', '3']
        },
      }, 'creator-id');

      await reviewService.submitReview('user-1', puzzle.id, { reviewText: 'First review' });

      await expect(
        reviewService.submitReview('user-1', puzzle.id, { reviewText: 'Second review' })
      ).rejects.toThrow();
    });
  });
});
