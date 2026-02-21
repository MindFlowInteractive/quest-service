import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { SkillRatingModule } from '../src/skill-rating/skill-rating.module';
import { PlayerRating } from '../src/skill-rating/entities/player-rating.entity';
import { RatingHistory } from '../src/skill-rating/entities/rating-history.entity';
import { Season } from '../src/skill-rating/entities/season.entity';
import { User } from '../src/users/entities/user.entity';
import { Puzzle } from '../src/puzzles/entities/puzzle.entity';

describe('SkillRatingController (e2e)', () => {
  let app: INestApplication;
  let userId: string;
  let puzzleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Puzzle, PlayerRating, RatingHistory, Season],
          synchronize: true,
        }),
        SkillRatingModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user
    const userResponse = await request(app.getHttpServer())
      .post('/users') // Assuming users endpoint exists
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
    
    userId = userResponse.body.id;

    // Create test puzzle
    const puzzleResponse = await request(app.getHttpServer())
      .post('/puzzles') // Assuming puzzles endpoint exists
      .send({
        title: 'Test Puzzle',
        description: 'A test puzzle for rating',
        category: 'logic',
        difficulty: 'medium',
        difficultyRating: 5,
        basePoints: 100,
        timeLimit: 300,
        content: {
          type: 'multiple-choice',
          question: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
        },
      });
    
    puzzleId = puzzleResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Player Rating Flow', () => {
    it('should create initial player rating', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skill-rating/player/${userId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        userId,
        rating: 1200,
        tier: 'bronze',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
      });
    });

    it('should update rating on puzzle completion', async () => {
      const completionData = {
        userId,
        puzzleId,
        puzzleDifficulty: 'medium',
        difficultyRating: 5,
        wasCompleted: true,
        timeTaken: 120,
        hintsUsed: 0,
        attempts: 1,
        basePoints: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/skill-rating/puzzle-completion')
        .send(completionData)
        .expect(201);

      expect(response.body.rating).toBeGreaterThan(1200);
      expect(response.body.tier).toBe('bronze'); // Still bronze for small change
      expect(response.body.gamesPlayed).toBe(1);
      expect(response.body.wins).toBe(1);
      expect(response.body.streak).toBe(1);
    });

    it('should apply penalty for failed puzzle', async () => {
      const completionData = {
        userId,
        puzzleId,
        puzzleDifficulty: 'medium',
        difficultyRating: 5,
        wasCompleted: false,
        timeTaken: 0,
        hintsUsed: 2,
        attempts: 3,
        basePoints: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/skill-rating/puzzle-completion')
        .send(completionData)
        .expect(201);

      expect(response.body.rating).toBeLessThan(1250); // Should be less than previous
      expect(response.body.losses).toBe(1);
      expect(response.body.streak).toBe(0);
    });

    it('should get rating history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skill-rating/history/${userId}?limit=10`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toMatchObject({
        ratingChange: expect.any(Number),
        reason: expect.any(String),
      });
    });

    it('should get leaderboard', async () => {
      const response = await request(app.getHttpServer())
        .get('/skill-rating/leaderboard?limit=10')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toMatchObject({
        userId: expect.any(String),
        rating: expect.any(Number),
      });
    });

    it('should get player rank', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skill-rating/rank/${userId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        rank: expect.any(Number),
      });
    });
  });

  describe('Season Management', () => {
    it('should get current season', async () => {
      const response = await request(app.getHttpServer())
        .get('/skill-rating/season/current')
        .expect(200);

      expect(response.body).toMatchObject({
        seasonId: expect.any(String),
        status: 'active',
      });
    });

    it('should get all seasons', async () => {
      const response = await request(app.getHttpServer())
        .get('/skill-rating/seasons')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});
