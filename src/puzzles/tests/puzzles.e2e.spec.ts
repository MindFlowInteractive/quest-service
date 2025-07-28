import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Puzzle } from '../entities/puzzle.entity';
import { JwtService } from '@nestjs/jwt';
import { CreatePuzzleDto, PuzzleDifficulty, PuzzleContentType } from '../dto';

describe('Puzzles E2E', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let puzzleRepository: Repository<Puzzle>;
  let jwtService: JwtService;

  let adminUser: User;
  let regularUser: User;
  let adminToken: string;
  let userToken: string;

  const samplePuzzle: CreatePuzzleDto = {
    title: 'E2E Test Puzzle: Advanced Logic Challenge',
    description:
      'This is a comprehensive end-to-end test puzzle designed to validate the complete puzzle management workflow from creation to completion.',
    category: 'logic',
    difficulty: PuzzleDifficulty.HARD,
    difficultyRating: 7,
    basePoints: 150,
    timeLimit: 600,
    maxHints: 2,
    content: {
      type: PuzzleContentType.LOGIC_GRID,
      question:
        'Three friends (Alice, Bob, Charlie) each have a different pet (cat, dog, bird) and live in different colored houses (red, blue, green). Using the clues, determine who owns which pet and lives in which house.',
      correctAnswer: {
        Alice: { pet: 'cat', house: 'red' },
        Bob: { pet: 'dog', house: 'blue' },
        Charlie: { pet: 'bird', house: 'green' },
      },
      explanation:
        'This is solved using logical deduction and process of elimination.',
      interactive: {
        components: ['grid', 'drag-drop'],
        rules: {
          allowMultipleAttempts: true,
          showProgressFeedback: true,
        },
      },
    },
    hints: [
      {
        order: 1,
        text: 'Alice does not live in the blue house and does not own a dog.',
        pointsPenalty: 20,
        unlockAfter: 120,
      },
      {
        order: 2,
        text: 'The person with the bird lives in the green house.',
        pointsPenalty: 30,
        unlockAfter: 300,
      },
    ],
    tags: ['logic', 'deduction', 'grid-puzzle', 'advanced'],
    prerequisites: [],
    scoring: {
      timeBonus: {
        enabled: true,
        maxBonus: 75,
        baseTime: 600,
      },
      accuracyBonus: {
        enabled: true,
        maxBonus: 25,
      },
      streakBonus: {
        enabled: false,
        multiplier: 1.0,
      },
    },
    isFeatured: false,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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

    userRepository = moduleFixture.get('UserRepository');
    puzzleRepository = moduleFixture.get('PuzzleRepository');
    jwtService = moduleFixture.get(JwtService);

    // Create test users
    adminUser = userRepository.create({
      username: 'admin_e2e',
      email: 'admin.e2e@test.com',
      password: 'hashedpassword',
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        preferredLanguage: 'en',
        avatar: null,
        bio: 'E2E Test Admin User',
        location: null,
        website: null,
        dateOfBirth: null,
      },
      preferences: {
        emailNotifications: true,
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        privacy: {
          showProfile: true,
          showProgress: true,
          showAchievements: true,
        },
      },
    });
    adminUser = await userRepository.save(adminUser);

    regularUser = userRepository.create({
      username: 'user_e2e',
      email: 'user.e2e@test.com',
      password: 'hashedpassword',
      role: 'user',
      profile: {
        firstName: 'Regular',
        lastName: 'User',
        preferredLanguage: 'en',
        avatar: null,
        bio: 'E2E Test Regular User',
        location: null,
        website: null,
        dateOfBirth: null,
      },
      preferences: {
        emailNotifications: false,
        theme: 'dark',
        language: 'en',
        timezone: 'EST',
        privacy: {
          showProfile: false,
          showProgress: true,
          showAchievements: false,
        },
      },
    });
    regularUser = await userRepository.save(regularUser);

    // Generate auth tokens
    adminToken = jwtService.sign({
      sub: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
    });

    userToken = jwtService.sign({
      sub: regularUser.id,
      username: regularUser.username,
      email: regularUser.email,
      role: regularUser.role,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Puzzle Lifecycle', () => {
    let createdPuzzleId: string;

    it('should complete the full puzzle creation workflow', async () => {
      // Step 1: Create puzzle
      const createResponse = await request(app.getHttpServer())
        .post('/puzzles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(samplePuzzle)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.title).toBe(samplePuzzle.title);
      expect(createResponse.body.publishedAt).toBeNull();
      createdPuzzleId = createResponse.body.id;

      // Step 2: Verify puzzle is not visible to regular users (unpublished)
      const searchUnpublished = await request(app.getHttpServer())
        .get('/puzzles')
        .query({ createdBy: adminUser.id })
        .expect(200);

      expect(searchUnpublished.body.puzzles).toHaveLength(0);

      // Step 3: Admin can see their own unpublished puzzle
      const adminSearch = await request(app.getHttpServer())
        .get('/puzzles')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ createdBy: adminUser.id })
        .expect(200);

      expect(adminSearch.body.puzzles.length).toBeGreaterThan(0);

      // Step 4: Update puzzle details
      const updateResponse = await request(app.getHttpServer())
        .patch(`/puzzles/${createdPuzzleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'E2E Test Puzzle: Advanced Logic Challenge (Updated)',
          updateReason: 'Enhanced puzzle description and clarity',
        })
        .expect(200);

      expect(updateResponse.body.title).toContain('(Updated)');

      // Step 5: Publish puzzle
      const publishResponse = await request(app.getHttpServer())
        .post(`/puzzles/${createdPuzzleId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(publishResponse.body.publishedAt).not.toBeNull();

      // Step 6: Verify puzzle is now visible to all users
      const publicSearch = await request(app.getHttpServer())
        .get('/puzzles')
        .query({ category: 'logic' })
        .expect(200);

      expect(
        publicSearch.body.puzzles.some((p) => p.id === createdPuzzleId),
      ).toBe(true);

      // Step 7: Regular user can view published puzzle
      const puzzleDetail = await request(app.getHttpServer())
        .get(`/puzzles/${createdPuzzleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(puzzleDetail.body.id).toBe(createdPuzzleId);
      expect(puzzleDetail.body.content).toBeDefined();
      expect(puzzleDetail.body.hints).toBeDefined();
    });

    it('should handle puzzle duplication workflow', async () => {
      // Duplicate the puzzle
      const duplicateResponse = await request(app.getHttpServer())
        .post(`/puzzles/${createdPuzzleId}/duplicate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(duplicateResponse.body.title).toContain('(Copy)');
      expect(duplicateResponse.body.id).not.toBe(createdPuzzleId);
      expect(duplicateResponse.body.publishedAt).toBeNull();
      expect(duplicateResponse.body.isFeatured).toBe(false);

      // Verify original puzzle still exists
      const originalPuzzle = await request(app.getHttpServer())
        .get(`/puzzles/${createdPuzzleId}`)
        .expect(200);

      expect(originalPuzzle.body.id).toBe(createdPuzzleId);
    });
  });

  describe('Advanced Search and Filtering', () => {
    beforeAll(async () => {
      // Create diverse puzzle dataset
      const puzzleTypes = [
        {
          ...samplePuzzle,
          title: 'Math: Algebra Basics',
          category: 'math',
          difficulty: PuzzleDifficulty.EASY,
          tags: ['math', 'algebra', 'basics'],
        },
        {
          ...samplePuzzle,
          title: 'Math: Calculus Advanced',
          category: 'math',
          difficulty: PuzzleDifficulty.EXPERT,
          tags: ['math', 'calculus', 'advanced'],
        },
        {
          ...samplePuzzle,
          title: 'Logic: Pattern Recognition',
          category: 'logic',
          difficulty: PuzzleDifficulty.MEDIUM,
          tags: ['logic', 'patterns'],
        },
        {
          ...samplePuzzle,
          title: 'Word: Vocabulary Challenge',
          category: 'word',
          difficulty: PuzzleDifficulty.HARD,
          tags: ['word', 'vocabulary'],
        },
        {
          ...samplePuzzle,
          title: 'Spatial: 3D Visualization',
          category: 'spatial',
          difficulty: PuzzleDifficulty.HARD,
          tags: ['spatial', '3d'],
        },
      ];

      for (const puzzleData of puzzleTypes) {
        const createResponse = await request(app.getHttpServer())
          .post('/puzzles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(puzzleData);

        // Publish some puzzles
        if (Math.random() > 0.3) {
          await request(app.getHttpServer())
            .post(`/puzzles/${createResponse.body.id}/publish`)
            .set('Authorization', `Bearer ${adminToken}`);
        }
      }
    });

    it('should perform complex search queries', async () => {
      // Search by text
      const textSearch = await request(app.getHttpServer())
        .get('/puzzles')
        .query({ search: 'Math' })
        .expect(200);

      expect(
        textSearch.body.puzzles.every(
          (p) =>
            p.title.includes('Math') ||
            p.description.includes('Math') ||
            p.tags.includes('math'),
        ),
      ).toBe(true);

      // Filter by multiple criteria
      const complexFilter = await request(app.getHttpServer())
        .get('/puzzles')
        .query({
          category: 'math',
          difficulty: 'expert',
          minRating: 5,
          maxRating: 10,
          tags: 'advanced,calculus',
        })
        .expect(200);

      expect(
        complexFilter.body.puzzles.every(
          (p) =>
            p.category === 'math' &&
            p.difficulty === 'expert' &&
            p.difficultyRating >= 5 &&
            p.difficultyRating <= 10,
        ),
      ).toBe(true);

      // Sort by different criteria
      const sortedByTitle = await request(app.getHttpServer())
        .get('/puzzles')
        .query({ sortBy: 'title', sortOrder: 'ASC' })
        .expect(200);

      const titles = sortedByTitle.body.puzzles.map((p) => p.title);
      const sortedTitles = [...titles].sort();
      expect(titles).toEqual(sortedTitles);
    });

    it('should handle pagination correctly', async () => {
      // Test pagination
      const page1 = await request(app.getHttpServer())
        .get('/puzzles')
        .query({ page: 1, limit: 2 })
        .expect(200);

      const page2 = await request(app.getHttpServer())
        .get('/puzzles')
        .query({ page: 2, limit: 2 })
        .expect(200);

      expect(page1.body.puzzles).toHaveLength(2);
      expect(page1.body.page).toBe(1);
      expect(page1.body.limit).toBe(2);
      expect(page1.body.totalPages).toBeGreaterThanOrEqual(1);

      // Ensure no overlap between pages
      const page1Ids = page1.body.puzzles.map((p) => p.id);
      const page2Ids = page2.body.puzzles.map((p) => p.id);
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Bulk Operations Workflow', () => {
    let bulkTestPuzzleIds: string[];

    beforeAll(async () => {
      // Create puzzles for bulk operations
      const bulkPuzzles = [
        { ...samplePuzzle, title: 'Bulk Test 1', tags: ['bulk', 'test'] },
        { ...samplePuzzle, title: 'Bulk Test 2', tags: ['bulk', 'test'] },
        { ...samplePuzzle, title: 'Bulk Test 3', tags: ['bulk', 'test'] },
      ];

      bulkTestPuzzleIds = [];
      for (const puzzleData of bulkPuzzles) {
        const response = await request(app.getHttpServer())
          .post('/puzzles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(puzzleData);
        bulkTestPuzzleIds.push(response.body.id);
      }
    });

    it('should execute bulk publish operation', async () => {
      const bulkPublish = await request(app.getHttpServer())
        .patch('/puzzles/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          puzzleIds: bulkTestPuzzleIds,
          bulkUpdate: {
            action: 'publish',
            reason: 'E2E bulk publish test',
          },
        })
        .expect(200);

      expect(bulkPublish.body.updated).toBe(3);
      expect(bulkPublish.body.errors).toHaveLength(0);

      // Verify all puzzles are published
      for (const puzzleId of bulkTestPuzzleIds) {
        const puzzle = await request(app.getHttpServer())
          .get(`/puzzles/${puzzleId}`)
          .expect(200);
        expect(puzzle.body.publishedAt).not.toBeNull();
      }
    });

    it('should execute bulk tag operations', async () => {
      // Add tags
      const addTags = await request(app.getHttpServer())
        .patch('/puzzles/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          puzzleIds: bulkTestPuzzleIds,
          bulkUpdate: {
            action: 'add_tags',
            value: 'e2e-tested,verified',
            reason: 'Adding E2E test verification tags',
          },
        })
        .expect(200);

      expect(addTags.body.updated).toBe(3);

      // Verify tags were added
      const puzzleWithNewTags = await request(app.getHttpServer())
        .get(`/puzzles/${bulkTestPuzzleIds[0]}`)
        .expect(200);

      expect(puzzleWithNewTags.body.tags).toContain('e2e-tested');
      expect(puzzleWithNewTags.body.tags).toContain('verified');

      // Remove tags
      const removeTags = await request(app.getHttpServer())
        .patch('/puzzles/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          puzzleIds: bulkTestPuzzleIds,
          bulkUpdate: {
            action: 'remove_tags',
            value: 'test',
            reason: 'Removing test tags',
          },
        })
        .expect(200);

      expect(removeTags.body.updated).toBe(3);

      // Verify tag was removed
      const puzzleWithoutTestTag = await request(app.getHttpServer())
        .get(`/puzzles/${bulkTestPuzzleIds[0]}`)
        .expect(200);

      expect(puzzleWithoutTestTag.body.tags).not.toContain('test');
    });

    it('should execute bulk category update', async () => {
      const updateCategory = await request(app.getHttpServer())
        .patch('/puzzles/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          puzzleIds: bulkTestPuzzleIds,
          bulkUpdate: {
            action: 'update_category',
            value: 'e2e-test',
            reason: 'Updating category for E2E test organization',
          },
        })
        .expect(200);

      expect(updateCategory.body.updated).toBe(3);

      // Verify category was updated
      for (const puzzleId of bulkTestPuzzleIds) {
        const puzzle = await request(app.getHttpServer())
          .get(`/puzzles/${puzzleId}`)
          .expect(200);
        expect(puzzle.body.category).toBe('e2e-test');
      }
    });
  });

  describe('Analytics and Reporting', () => {
    it('should provide comprehensive analytics', async () => {
      const analytics = await request(app.getHttpServer())
        .get('/puzzles/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(analytics.body).toHaveProperty('totalPuzzles');
      expect(analytics.body).toHaveProperty('publishedPuzzles');
      expect(analytics.body).toHaveProperty('categoryCounts');
      expect(analytics.body).toHaveProperty('difficultyDistribution');
      expect(analytics.body).toHaveProperty('averageRating');
      expect(analytics.body).toHaveProperty('topPerformingPuzzles');
      expect(analytics.body).toHaveProperty('recentActivity');

      expect(analytics.body.totalPuzzles).toBeGreaterThan(0);
      expect(typeof analytics.body.categoryCounts).toBe('object');
      expect(typeof analytics.body.difficultyDistribution).toBe('object');
      expect(Array.isArray(analytics.body.topPerformingPuzzles)).toBe(true);
    });

    it('should filter analytics by time period', async () => {
      const weeklyAnalytics = await request(app.getHttpServer())
        .get('/puzzles/analytics')
        .query({ period: 'week' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const monthlyAnalytics = await request(app.getHttpServer())
        .get('/puzzles/analytics')
        .query({ period: 'month' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(weeklyAnalytics.body.recentActivity.created).toBeLessThanOrEqual(
        monthlyAnalytics.body.recentActivity.created,
      );
    });
  });

  describe('Permission and Access Control', () => {
    let userPuzzleId: string;

    beforeAll(async () => {
      // Create a puzzle as regular user
      const userPuzzle = await request(app.getHttpServer())
        .post('/puzzles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(samplePuzzle);
      userPuzzleId = userPuzzle.body.id;
    });

    it('should enforce puzzle ownership for updates', async () => {
      // Admin tries to update user's puzzle (should fail)
      await request(app.getHttpServer())
        .patch(`/puzzles/${userPuzzleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Unauthorized Update' })
        .expect(400);

      // User updates their own puzzle (should succeed)
      await request(app.getHttpServer())
        .patch(`/puzzles/${userPuzzleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Authorized Update by Owner' })
        .expect(200);
    });

    it('should enforce puzzle ownership for deletion', async () => {
      // Create puzzle for deletion test
      const puzzleToDelete = await request(app.getHttpServer())
        .post('/puzzles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...samplePuzzle, title: 'Puzzle for Deletion Test' });

      // Admin tries to delete user's puzzle (should fail)
      await request(app.getHttpServer())
        .delete(`/puzzles/${puzzleToDelete.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      // User deletes their own puzzle (should succeed)
      await request(app.getHttpServer())
        .delete(`/puzzles/${puzzleToDelete.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
    });

    it('should restrict unpublished puzzle access', async () => {
      // Create unpublished puzzle
      const unpublishedPuzzle = await request(app.getHttpServer())
        .post('/puzzles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...samplePuzzle, title: 'Unpublished Access Test' });

      // Other user cannot access unpublished puzzle
      await request(app.getHttpServer())
        .get(`/puzzles/${unpublishedPuzzle.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // Owner can access their unpublished puzzle
      await request(app.getHttpServer())
        .get(`/puzzles/${unpublishedPuzzle.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid puzzle IDs gracefully', async () => {
      await request(app.getHttpServer())
        .get('/puzzles/invalid-uuid')
        .expect(400);

      await request(app.getHttpServer())
        .get('/puzzles/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);
    });

    it('should validate puzzle creation data thoroughly', async () => {
      const invalidPuzzles = [
        { ...samplePuzzle, title: '' }, // Empty title
        { ...samplePuzzle, description: 'Short' }, // Too short description
        { ...samplePuzzle, difficultyRating: 11 }, // Invalid rating
        { ...samplePuzzle, timeLimit: 0 }, // Invalid time limit
        { ...samplePuzzle, content: { type: 'invalid-type' } }, // Invalid content type
      ];

      for (const invalidPuzzle of invalidPuzzles) {
        await request(app.getHttpServer())
          .post('/puzzles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidPuzzle)
          .expect(400);
      }
    });

    it('should handle bulk operations with mixed success/failure', async () => {
      // Create some puzzles and include a non-existent ID
      const mixedIds = [
        ...bulkTestPuzzleIds.slice(0, 2),
        '123e4567-e89b-12d3-a456-426614174000',
      ];

      const bulkResult = await request(app.getHttpServer())
        .patch('/puzzles/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          puzzleIds: mixedIds,
          bulkUpdate: {
            action: 'add_tags',
            value: 'mixed-test',
          },
        })
        .expect(200);

      expect(bulkResult.body.updated).toBe(2);
      expect(bulkResult.body.errors).toHaveLength(1);
    });

    it('should handle concurrent puzzle updates', async () => {
      // Create puzzle for concurrent test
      const puzzle = await request(app.getHttpServer())
        .post('/puzzles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...samplePuzzle, title: 'Concurrent Update Test' });

      // Simulate concurrent updates
      const updates = [
        request(app.getHttpServer())
          .patch(`/puzzles/${puzzle.body.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Update 1', updateReason: 'First update' }),
        request(app.getHttpServer())
          .patch(`/puzzles/${puzzle.body.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Update 2', updateReason: 'Second update' }),
      ];

      const results = await Promise.all(updates);

      // Both updates should succeed (last one wins)
      expect(results[0].status).toBe(200);
      expect(results[1].status).toBe(200);

      // Verify final state
      const finalPuzzle = await request(app.getHttpServer())
        .get(`/puzzles/${puzzle.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(['Update 1', 'Update 2']).toContain(finalPuzzle.body.title);
    });
  });
});
