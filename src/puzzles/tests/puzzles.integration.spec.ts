import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { PuzzlesModule } from '../puzzles.module';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleProgress } from '../../game-logic/entities/puzzle-progress.entity';
import { User } from '../../auth/entities/user.entity';
import { AuthModule } from '../../auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import {
  CreatePuzzleDto,
  UpdatePuzzleDto,
  PuzzleDifficulty,
  PuzzleContentType,
} from '../dto';

describe('Puzzles Integration Tests', () => {
  let app: INestApplication;
  let puzzleRepository: Repository<Puzzle>;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let authToken: string;
  let testUser: User;

  const testPuzzleDto: CreatePuzzleDto = {
    title: 'Integration Test Puzzle',
    description:
      'A comprehensive integration test puzzle with sufficient description length to pass validation',
    category: 'integration-test',
    difficulty: PuzzleDifficulty.MEDIUM,
    difficultyRating: 5,
    basePoints: 100,
    timeLimit: 300,
    maxHints: 3,
    content: {
      type: PuzzleContentType.MULTIPLE_CHOICE,
      question: 'What is the purpose of integration testing?',
      options: [
        'To test individual components in isolation',
        'To test the interaction between different components',
        'To test the user interface only',
        'To test database performance',
      ],
      correctAnswer: 'To test the interaction between different components',
      explanation:
        'Integration testing verifies that different components work together correctly.',
    },
    hints: [
      {
        order: 1,
        text: 'Think about how different parts of a system work together',
        pointsPenalty: 10,
        unlockAfter: 60,
      },
    ],
    tags: ['testing', 'integration', 'software-development'],
    prerequisites: [],
    scoring: {
      timeBonus: {
        enabled: true,
        maxBonus: 50,
        baseTime: 300,
      },
    },
    isFeatured: false,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Puzzle, PuzzleProgress, User],
          synchronize: true,
          logging: false,
        }),
        PuzzlesModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

  puzzleRepository = moduleFixture.get<Repository<Puzzle>>(getRepositoryToken(Puzzle));
  userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    jwtService = moduleFixture.get(JwtService);

    // Create test user
    testUser = userRepository.create({
      email: 'test@example.com',
      password: 'hashedpassword',
      isVerified: true,
    });
    testUser = await userRepository.save(testUser);

    // Generate auth token
    authToken = jwtService.sign({
      sub: testUser.id,
      email: testUser.email,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await puzzleRepository.clear();
  });

  describe('POST /puzzles', () => {
    it('should create a puzzle with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/puzzles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testPuzzleDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(testPuzzleDto.title);
      expect(response.body.category).toBe(testPuzzleDto.category);
      expect(response.body.createdBy).toBe(testUser.id);
      expect(response.body.publishedAt).toBeNull();

      // Verify in database
      const puzzleInDb = await puzzleRepository.findOne({
        where: { id: response.body.id },
      });
      expect(puzzleInDb).toBeDefined();
      expect(puzzleInDb).not.toBeNull();
      expect(puzzleInDb!.title).toBe(testPuzzleDto.title);
    });

    it('should reject puzzle creation without authentication', async () => {
      await request(app.getHttpServer())
        .post('/puzzles')
        .send(testPuzzleDto)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const invalidPuzzle = {
        title: 'Short', // Too short
        description: 'Short', // Too short
        category: '',
        difficulty: 'invalid-difficulty',
      };

      const response = await request(app.getHttpServer())
        .post('/puzzles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPuzzle)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should validate content structure', async () => {
      const puzzleWithInvalidContent = {
        ...testPuzzleDto,
        content: {
          type: 'invalid-type',
          question: '', // Too short
        },
      };

      await request(app.getHttpServer())
        .post('/puzzles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(puzzleWithInvalidContent)
        .expect(400);
    });
  });

  describe('GET /puzzles', () => {
    beforeEach(async () => {
      // Create test puzzles
      const puzzles = [
        {
          ...testPuzzleDto,
          title: 'Math Puzzle 1',
          category: 'math',
          difficulty: 'easy' as const,
          publishedAt: new Date(),
          createdBy: testUser.id,
        },
        {
          ...testPuzzleDto,
          title: 'Logic Puzzle 1',
          category: 'logic',
          difficulty: 'hard' as const,
          publishedAt: new Date(),
          createdBy: testUser.id,
        },
        {
          ...testPuzzleDto,
          title: 'Unpublished Puzzle',
          category: 'math',
          difficulty: 'medium' as const,
          publishedAt: undefined,
          createdBy: testUser.id,
        },
      ];

      for (const puzzleData of puzzles) {
        const puzzle = puzzleRepository.create(puzzleData);
        await puzzleRepository.save(puzzle);
      }
    });

    it('should return paginated puzzles', async () => {
      const response = await request(app.getHttpServer())
        .get('/puzzles')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('puzzles');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.puzzles)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/puzzles')
        .query({ category: 'math' })
        .expect(200);

      expect(response.body.puzzles.every((p) => p.category === 'math')).toBe(
        true,
      );
    });

    it('should filter by difficulty', async () => {
      const response = await request(app.getHttpServer())
        .get('/puzzles')
        .query({ difficulty: 'easy' })
        .expect(200);

      expect(response.body.puzzles.every((p) => p.difficulty === 'easy')).toBe(
        true,
      );
    });

    it('should search by title and description', async () => {
      const response = await request(app.getHttpServer())
        .get('/puzzles')
        .query({ search: 'Math' })
        .expect(200);

      expect(response.body.puzzles.some((p) => p.title.includes('Math'))).toBe(
        true,
      );
    });

    it('should sort results', async () => {
      const response = await request(app.getHttpServer())
        .get('/puzzles')
        .query({ sortBy: 'title', sortOrder: 'ASC' })
        .expect(200);

      const titles = response.body.puzzles.map((p) => p.title);
      const sortedTitles = [...titles].sort();
      expect(titles).toEqual(sortedTitles);
    });
  });

  describe('GET /puzzles/:id', () => {
    let testPuzzle: Puzzle;

    beforeEach(async () => {
      testPuzzle = puzzleRepository.create({
        ...testPuzzleDto,
        publishedAt: new Date(),
        createdBy: testUser.id,
      });
      testPuzzle = await puzzleRepository.save(testPuzzle);
    });

    it('should return a puzzle by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/puzzles/${testPuzzle.id}`)
        .expect(200);

      expect(response.body.id).toBe(testPuzzle.id);
      expect(response.body.title).toBe(testPuzzle.title);
      expect(response.body).toHaveProperty('totalPlays');
      expect(response.body).toHaveProperty('averageRating');
    });

    it('should return 404 for non-existent puzzle', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      await request(app.getHttpServer()).get(`/puzzles/${fakeId}`).expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/puzzles/invalid-uuid')
        .expect(400);
    });
  });

  describe('PATCH /puzzles/:id', () => {
    let testPuzzle: Puzzle;

    beforeEach(async () => {
      testPuzzle = puzzleRepository.create({
        ...testPuzzleDto,
        createdBy: testUser.id,
      });
      testPuzzle = await puzzleRepository.save(testPuzzle);
    });

    it('should update a puzzle', async () => {
      const updateDto: UpdatePuzzleDto = {
        title: 'Updated Integration Test Puzzle',
        updateReason: 'Testing integration update functionality',
      };

      const response = await request(app.getHttpServer())
        .patch(`/puzzles/${testPuzzle.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.title).toBe(updateDto.title);

      // Verify in database
      const updatedPuzzle = await puzzleRepository.findOne({
        where: { id: testPuzzle.id },
      });
      expect(updatedPuzzle).not.toBeNull();
      expect(updatedPuzzle!.title).toBe(updateDto.title);
    });

    it('should reject update without authentication', async () => {
      const updateDto: UpdatePuzzleDto = {
        title: 'Unauthorized Update',
      };

      await request(app.getHttpServer())
        .patch(`/puzzles/${testPuzzle.id}`)
        .send(updateDto)
        .expect(401);
    });

    it('should reject update by non-owner', async () => {
      // Create another user
      const anotherUser = userRepository.create({
        email: 'another@example.com',
        password: 'hashedpassword',
        isVerified: true,
      });
      await userRepository.save(anotherUser);

      const anotherToken = jwtService.sign({
        sub: anotherUser.id,
        email: anotherUser.email,
      });

      const updateDto: UpdatePuzzleDto = {
        title: 'Unauthorized Update',
      };

      await request(app.getHttpServer())
        .patch(`/puzzles/${testPuzzle.id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send(updateDto)
        .expect(400);
    });
  });

  describe('DELETE /puzzles/:id', () => {
    let testPuzzle: Puzzle;

    beforeEach(async () => {
      testPuzzle = puzzleRepository.create({
        ...testPuzzleDto,
        createdBy: testUser.id,
      });
      testPuzzle = await puzzleRepository.save(testPuzzle);
    });

    it('should delete a puzzle without progress', async () => {
      await request(app.getHttpServer())
        .delete(`/puzzles/${testPuzzle.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify puzzle is deleted
      const deletedPuzzle = await puzzleRepository.findOne({
        where: { id: testPuzzle.id },
      });
      expect(deletedPuzzle).toBeNull();
    });

    it('should reject delete without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/puzzles/${testPuzzle.id}`)
        .expect(401);
    });
  });

  describe('PATCH /puzzles/bulk', () => {
    let testPuzzles: Puzzle[];

    beforeEach(async () => {
      const puzzleData = [
        { ...testPuzzleDto, title: 'Bulk Test 1' },
        { ...testPuzzleDto, title: 'Bulk Test 2' },
        { ...testPuzzleDto, title: 'Bulk Test 3' },
      ];

      testPuzzles = [];
      for (const data of puzzleData) {
        const puzzle = puzzleRepository.create({
          ...data,
          createdBy: testUser.id,
        });
        testPuzzles.push(await puzzleRepository.save(puzzle));
      }
    });

    it('should perform bulk publish operation', async () => {
      const puzzleIds = testPuzzles.map((p) => p.id);
      const bulkUpdateDto = {
        action: 'publish',
        reason: 'Integration test bulk publish',
      };

      const response = await request(app.getHttpServer())
        .patch('/puzzles/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          puzzleIds,
          bulkUpdate: bulkUpdateDto,
        })
        .expect(200);

      expect(response.body.updated).toBe(3);
      expect(response.body.errors).toHaveLength(0);

      // Verify puzzles are published
      for (const puzzle of testPuzzles) {
        const updatedPuzzle = await puzzleRepository.findOne({
          where: { id: puzzle.id },
        });
        expect(updatedPuzzle).not.toBeNull();
        expect(updatedPuzzle!.publishedAt).not.toBeNull();
      }
    });

    it('should handle bulk tag operations', async () => {
      const puzzleIds = testPuzzles.map((p) => p.id);
      const bulkUpdateDto = {
        action: 'add_tags',
        value: 'bulk-test,integration',
        reason: 'Adding integration test tags',
      };

      const response = await request(app.getHttpServer())
        .patch('/puzzles/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          puzzleIds,
          bulkUpdate: bulkUpdateDto,
        })
        .expect(200);

      expect(response.body.updated).toBe(3);

      // Verify tags were added
      for (const puzzle of testPuzzles) {
        const updatedPuzzle = await puzzleRepository.findOne({
          where: { id: puzzle.id },
        });
        expect(updatedPuzzle).not.toBeNull();
        expect(updatedPuzzle!.tags).toContain('bulk-test');
        expect(updatedPuzzle!.tags).toContain('integration');
      }
    });
  });

  describe('GET /puzzles/analytics', () => {
    beforeEach(async () => {
      // Create diverse test data
      const puzzleData = [
        {
          ...testPuzzleDto,
          category: 'math',
          difficulty: 'easy' as const,
          publishedAt: new Date(),
        },
        {
          ...testPuzzleDto,
          category: 'math',
          difficulty: 'medium' as const,
          publishedAt: new Date(),
        },
        {
          ...testPuzzleDto,
          category: 'logic',
          difficulty: 'hard' as const,
          publishedAt: new Date(),
        },
        {
          ...testPuzzleDto,
          category: 'logic',
          difficulty: 'expert' as const,
          publishedAt: undefined,
        },
      ];

      for (const data of puzzleData) {
        const puzzle = puzzleRepository.create({
          ...data,
          createdBy: testUser.id,
        });
        await puzzleRepository.save(puzzle);
      }
    });

    it('should return comprehensive analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/puzzles/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalPuzzles');
      expect(response.body).toHaveProperty('publishedPuzzles');
      expect(response.body).toHaveProperty('categoryCounts');
      expect(response.body).toHaveProperty('difficultyDistribution');
      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('recentActivity');

      expect(response.body.totalPuzzles).toBe(4);
      expect(response.body.publishedPuzzles).toBe(3);
      expect(response.body.categoryCounts).toHaveProperty('math');
      expect(response.body.categoryCounts).toHaveProperty('logic');
    });

    it('should filter analytics by time period', async () => {
      const response = await request(app.getHttpServer())
        .get('/puzzles/analytics')
        .query({ period: 'week' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalPuzzles');
      expect(response.body).toHaveProperty('recentActivity');
    });
  });

  describe('POST /puzzles/:id/publish', () => {
    let testPuzzle: Puzzle;

    beforeEach(async () => {
      testPuzzle = puzzleRepository.create({
        ...testPuzzleDto,
        publishedAt: undefined,
        createdBy: testUser.id,
      });
      testPuzzle = await puzzleRepository.save(testPuzzle);
    });

    it('should publish a puzzle', async () => {
      const response = await request(app.getHttpServer())
        .post(`/puzzles/${testPuzzle.id}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.publishedAt).not.toBeNull();

      // Verify in database
      const publishedPuzzle = await puzzleRepository.findOne({
        where: { id: testPuzzle.id },
      });
      expect(publishedPuzzle).not.toBeNull();
      expect(publishedPuzzle!.publishedAt).not.toBeNull();
    });
  });

  describe('POST /puzzles/:id/duplicate', () => {
    let testPuzzle: Puzzle;

    beforeEach(async () => {
      testPuzzle = puzzleRepository.create({
        ...testPuzzleDto,
        publishedAt: new Date(),
        createdBy: testUser.id,
      });
      testPuzzle = await puzzleRepository.save(testPuzzle);
    });

    it('should duplicate a puzzle', async () => {
      const response = await request(app.getHttpServer())
        .post(`/puzzles/${testPuzzle.id}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.title).toBe(`${testPuzzle.title} (Copy)`);
      expect(response.body.id).not.toBe(testPuzzle.id);
      expect(response.body.createdBy).toBe(testUser.id);
      expect(response.body.isFeatured).toBe(false);

      // Verify both puzzles exist in database
      const originalPuzzle = await puzzleRepository.findOne({
        where: { id: testPuzzle.id },
      });
      const duplicatedPuzzle = await puzzleRepository.findOne({
        where: { id: response.body.id },
      });

      expect(originalPuzzle).toBeDefined();
      expect(duplicatedPuzzle).toBeDefined();
      expect(duplicatedPuzzle).not.toBeNull();
      expect(duplicatedPuzzle!.title).toContain('(Copy)');
    });
  });
});
