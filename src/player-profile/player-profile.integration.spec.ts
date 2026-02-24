import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { PlayerProfileModule } from './player-profile.module';
import { PlayerProfile } from './entities/player-profile.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtService } from '@nestjs/jwt';

describe('PlayerProfile Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const testUser = {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword'
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [PlayerProfile, User],
          synchronize: true,
        }),
        PlayerProfileModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Profile Management', () => {
    let authToken: string;

    beforeEach(() => {
      authToken = jwtService.sign({ sub: testUser.id, username: testUser.username });
    });

    it('should get profile for user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/profile/${testUser.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        userId: testUser.id,
        username: testUser.username,
        isProfilePublic: true
      });
    });

    it('should update profile with authentication', async () => {
      const updateData = {
        bio: 'Updated bio',
        title: 'Puzzle Master',
        location: 'New York',
        socialLinks: {
          twitter: '@testuser',
          discord: 'testuser#1234'
        }
      };

      const response = await request(app.getHttpServer())
        .put('/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.bio).toBe('Updated bio');
      expect(response.body.title).toBe('Puzzle Master');
      expect(response.body.location).toBe('New York');
    });

    it('should update privacy settings', async () => {
      const privacyUpdate = {
        privacySettings: {
          isProfilePublic: false,
          showBio: false,
          showStats: true
        }
      };

      await request(app.getHttpServer())
        .put('/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(privacyUpdate)
        .expect(200);

      // Verify privacy settings are applied
      const response = await request(app.getHttpServer())
        .get(`/profile/${testUser.id}`)
        .expect(403); // Should be forbidden for non-owner

      expect(response.body.message).toContain('private');
    });

    it('should update displayed badges', async () => {
      const badgeUpdate = {
        displayedBadges: ['first-win', 'puzzle-master', 'speed-demon']
      };

      const response = await request(app.getHttpServer())
        .put('/profile/badges')
        .set('Authorization', `Bearer ${authToken}`)
        .send(badgeUpdate)
        .expect(200);

      expect(response.body.badges).toEqual(['first-win', 'puzzle-master', 'speed-demon']);
    });

    it('should update profile statistics', async () => {
      const statsUpdate = {
        totalGamesPlayed: 150,
        totalWins: 120,
        winRate: 0.8,
        averageScore: 850,
        bestScore: 1000
      };

      const response = await request(app.getHttpServer())
        .put('/profile/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .send(statsUpdate)
        .expect(200);

      expect(response.body.statistics.totalGamesPlayed).toBe(150);
      expect(response.body.statistics.winRate).toBe(0.8);
    });

    it('should search public profiles', async () => {
      // First make profile public
      await request(app.getHttpServer())
        .put('/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ privacySettings: { isProfilePublic: true } });

      const response = await request(app.getHttpServer())
        .get('/profile/search?q=test&limit=10')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get public profiles list', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/public?limit=20&offset=0')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require authentication for profile updates', async () => {
      await request(app.getHttpServer())
        .put('/profile')
        .send({ bio: 'Should fail' })
        .expect(401);
    });

    it('should require authentication for badge updates', async () => {
      await request(app.getHttpServer())
        .put('/profile/badges')
        .send({ displayedBadges: ['first-win'] })
        .expect(401);
    });

    it('should require authentication for statistics updates', async () => {
      await request(app.getHttpServer())
        .put('/profile/statistics')
        .send({ totalGamesPlayed: 100 })
        .expect(401);
    });
  });

  describe('Customization Endpoints', () => {
    it('should get all available badges', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/customization/badges')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('category');
    });

    it('should get badges by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/customization/badges/category/achievement')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(badge => badge.category === 'achievement')).toBe(true);
    });

    it('should get badges by rarity', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/customization/badges/rarity/rare')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(badge => badge.rarity === 'rare')).toBe(true);
    });

    it('should get all banner themes', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/customization/themes')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('colors');
    });

    it('should get unlockable themes', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/customization/themes/unlockable')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(theme => theme.isUnlockable)).toBe(true);
    });

    it('should get specific theme details', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/customization/themes/cosmic')
        .expect(200);

      expect(response.body.id).toBe('cosmic');
      expect(response.body.name).toBe('Cosmic');
      expect(response.body).toHaveProperty('colors');
    });
  });

  describe('File Upload Validation', () => {
    let authToken: string;

    beforeEach(() => {
      authToken = jwtService.sign({ sub: testUser.id, username: testUser.username });
    });

    it('should reject invalid file types for avatar', async () => {
      const response = await request(app.getHttpServer())
        .post('/profile/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-text-file'), 'test.txt')
        .expect(400);

      expect(response.body.message).toContain('Invalid file type');
    });

    it('should reject oversized files for avatar', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      
      const response = await request(app.getHttpServer())
        .post('/profile/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeBuffer, 'large.jpg')
        .expect(400);

      expect(response.body.message).toContain('File too large');
    });

    it('should reject invalid file types for banner', async () => {
      const response = await request(app.getHttpServer())
        .post('/profile/banner')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-text-file'), 'test.txt')
        .expect(400);

      expect(response.body.message).toContain('Invalid file type');
    });
  });

  describe('Profile Statistics Access Control', () => {
    let authToken: string;
    let otherUserToken: string;

    beforeEach(() => {
      authToken = jwtService.sign({ sub: testUser.id, username: testUser.username });
      otherUserToken = jwtService.sign({ sub: 'other-user', username: 'otheruser' });
    });

    it('should allow owner to view statistics', async () => {
      // Set up profile with statistics
      await request(app.getHttpServer())
        .put('/profile/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ totalGamesPlayed: 100, totalWins: 75 });

      const response = await request(app.getHttpServer())
        .get(`/profile/statistics/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalGamesPlayed).toBe(100);
    });

    it('should respect privacy settings for statistics', async () => {
      // Make statistics private
      await request(app.getHttpServer())
        .put('/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ privacySettings: { showStats: false } });

      await request(app.getHttpServer())
        .get(`/profile/statistics/${testUser.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });
});