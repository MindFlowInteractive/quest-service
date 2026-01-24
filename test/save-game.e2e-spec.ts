import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SaveGameModule } from '../src/save-game/save-game.module';
import { SaveGame } from '../src/save-game/entities/save-game.entity';
import { SaveGameBackup } from '../src/save-game/entities/save-game-backup.entity';
import { SaveGameAnalytics } from '../src/save-game/entities/save-game-analytics.entity';
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/auth/entities/role.entity';
import { SaveType, SyncStatus } from '../src/save-game/interfaces/save-game.interfaces';

describe('SaveGame System (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  const testUserId = 'test-user-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [SaveGame, SaveGameBackup, SaveGameAnalytics, User, Role],
          synchronize: true,
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        SaveGameModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ sub: testUserId, email: 'test@example.com' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/save-games (POST)', () => {
    const validSaveData = {
      slotId: 0,
      slotName: 'Test Save',
      saveType: SaveType.MANUAL,
      data: {
        version: 1,
        gameState: { level: 1, score: 1000 },
        playerState: {
          position: { x: 100, y: 200 },
          health: 100,
          inventory: ['sword'],
        },
        progressState: {
          completedLevels: ['tutorial'],
          unlockedAchievements: [],
        },
      },
      playtime: 3600,
    };

    it('should create a new save game', () => {
      return request(app.getHttpServer())
        .post('/save-games')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validSaveData)
        .expect(201)
        .expect((res) => {
          expect(res.body.slotId).toBe(0);
          expect(res.body.slotName).toBe('Test Save');
          expect(res.body.syncStatus).toBe(SyncStatus.LOCAL_ONLY);
        });
    });

    it('should reject duplicate slot', () => {
      return request(app.getHttpServer())
        .post('/save-games')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validSaveData)
        .expect(400);
    });

    it('should reject invalid slot ID', () => {
      return request(app.getHttpServer())
        .post('/save-games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validSaveData, slotId: 100 })
        .expect(400);
    });

    it('should reject invalid save data', () => {
      return request(app.getHttpServer())
        .post('/save-games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          slotId: 5,
          data: { version: 1 }, // Missing required fields
        })
        .expect(400);
    });

    it('should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .post('/save-games')
        .send(validSaveData)
        .expect(401);
    });
  });

  describe('/save-games (GET)', () => {
    it('should return all save games for user', () => {
      return request(app.getHttpServer())
        .get('/save-games')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/save-games/:slotId (GET)', () => {
    it('should return specific save game', () => {
      return request(app.getHttpServer())
        .get('/save-games/0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.slotId).toBe(0);
        });
    });

    it('should return 404 for non-existent slot', () => {
      return request(app.getHttpServer())
        .get('/save-games/99')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/save-games/:slotId/load (GET)', () => {
    it('should load and decrypt save data', () => {
      return request(app.getHttpServer())
        .get('/save-games/0/load')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.version).toBeDefined();
          expect(res.body.gameState).toBeDefined();
          expect(res.body.playerState).toBeDefined();
          expect(res.body.progressState).toBeDefined();
        });
    });
  });

  describe('/save-games/:slotId (PUT)', () => {
    it('should update save game', () => {
      return request(app.getHttpServer())
        .put('/save-games/0')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          slotName: 'Updated Save',
          playtime: 7200,
          data: {
            version: 1,
            gameState: { level: 2, score: 2000 },
            playerState: { health: 80 },
            progressState: { completedLevels: ['tutorial', 'level1'] },
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.slotName).toBe('Updated Save');
          expect(res.body.syncStatus).toBe(SyncStatus.LOCAL_NEWER);
        });
    });
  });

  describe('/save-games/sync (POST)', () => {
    it('should sync save game status', () => {
      return request(app.getHttpServer())
        .post('/save-games/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          slotId: 0,
          localChecksum: 'different-checksum',
          lastModifiedAt: new Date().toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.syncStatus).toBeDefined();
        });
    });
  });

  describe('/save-games/cloud (GET)', () => {
    it('should return cloud saves', () => {
      return request(app.getHttpServer())
        .get('/save-games/cloud')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/save-games/quick-save (POST)', () => {
    it('should create quick save', () => {
      return request(app.getHttpServer())
        .post('/save-games/quick-save')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          version: 1,
          gameState: { quicksave: true },
          playerState: { health: 50 },
          progressState: { completedLevels: [] },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.slotId).toBe(98); // Quick save slot
          expect(res.body.saveType).toBe(SaveType.QUICKSAVE);
        });
    });
  });

  describe('/save-games/quick-load (GET)', () => {
    it('should load quick save', () => {
      return request(app.getHttpServer())
        .get('/save-games/quick-load')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.gameState.quicksave).toBe(true);
        });
    });
  });

  describe('/save-games/auto-save/enable (POST)', () => {
    it('should enable auto-save', () => {
      return request(app.getHttpServer())
        .post('/save-games/auto-save/enable')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ intervalMs: 60000 })
        .expect(201)
        .expect((res) => {
          expect(res.body.enabled).toBe(true);
        });
    });
  });

  describe('/save-games/auto-save/trigger (POST)', () => {
    it('should trigger auto-save', () => {
      return request(app.getHttpServer())
        .post('/save-games/auto-save/trigger')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          version: 1,
          gameState: { autosave: true },
          playerState: {},
          progressState: {},
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.slotId).toBe(99); // Auto save slot
        });
    });
  });

  describe('/save-games/backups (GET)', () => {
    it('should return backups', () => {
      return request(app.getHttpServer())
        .get('/save-games/backups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/save-games/analytics (GET)', () => {
    it('should return save game analytics', () => {
      return request(app.getHttpServer())
        .get('/save-games/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.totalSaves).toBeDefined();
          expect(res.body.totalLoads).toBeDefined();
        });
    });
  });

  describe('/save-games/slots/empty (GET)', () => {
    it('should return empty slots', () => {
      return request(app.getHttpServer())
        .get('/save-games/slots/empty')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).not.toContain(0); // Slot 0 is used
        });
    });
  });

  describe('/save-games/:slotId (DELETE)', () => {
    it('should delete save game', () => {
      return request(app.getHttpServer())
        .delete('/save-games/0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 after deletion', () => {
      return request(app.getHttpServer())
        .get('/save-games/0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
