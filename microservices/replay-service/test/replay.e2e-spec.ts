import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrivacyLevel } from '../src/entities/replay.entity';
import { ActionType } from '../src/entities/action.entity';

describe('Replay Service (e2e)', () => {
  let app: INestApplication;
  let replayId: string;
  const playerId = 1;
  const puzzleId = 1;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Replay Creation and Management', () => {
    it('POST /replay/create - should create a new replay', () => {
      return request(app.getHttpServer())
        .post('/replay/create')
        .send({
          puzzleId,
          playerId,
          title: 'Test Puzzle Replay',
          description: 'Testing replay creation',
          initialState: { grid: [1, 2, 3] },
        })
        .expect(201)
        .then((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Test Puzzle Replay');
          expect(res.body.privacyLevel).toBe(PrivacyLevel.PRIVATE);
          replayId = res.body.id;
        });
    });

    it('GET /replay/:replayId - should retrieve created replay', () => {
      return request(app.getHttpServer())
        .get(`/replay/${replayId}`)
        .query({ viewerId: playerId })
        .expect(200)
        .then((res) => {
          expect(res.body.id).toBe(replayId);
          expect(res.body.title).toBe('Test Puzzle Replay');
        });
    });
  });

  describe('Action Recording', () => {
    it('POST /replay/:replayId/action - should record a single action', () => {
      return request(app.getHttpServer())
        .post(`/replay/${replayId}/action`)
        .send({
          type: ActionType.MOVE,
          payload: { x: 10, y: 20 },
          timestamp: Date.now(),
        })
        .expect(201)
        .then((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.type).toBe(ActionType.MOVE);
          expect(res.body.sequence).toBe(1);
        });
    });

    it('POST /replay/:replayId/actions - should batch record actions', () => {
      return request(app.getHttpServer())
        .post(`/replay/${replayId}/actions`)
        .send([
          {
            type: ActionType.ROTATE,
            payload: { angle: 90 },
            timestamp: Date.now() + 1000,
          },
          {
            type: ActionType.PLACE_PIECE,
            payload: { x: 5, y: 10 },
            timestamp: Date.now() + 2000,
          },
        ])
        .expect(201)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body[0].sequence).toBe(2);
          expect(res.body[1].sequence).toBe(3);
        });
    });

    it('GET /replay/:replayId/actions - should retrieve recorded actions', () => {
      return request(app.getHttpServer())
        .get(`/replay/${replayId}/actions`)
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(3);
        });
    });
  });

  describe('Playback Generation', () => {
    it('POST /replay/:replayId/playback - should generate playback data', () => {
      return request(app.getHttpServer())
        .post(`/replay/${replayId}/playback`)
        .send({
          speed: 1.5,
        })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty('actions');
          expect(res.body).toHaveProperty('totalDuration');
          expect(res.body).toHaveProperty('frameRate');
          expect(Array.isArray(res.body.actions)).toBe(true);
        });
    });

    it('POST /replay/:replayId/playback - should support position filtering', () => {
      return request(app.getHttpServer())
        .post(`/replay/${replayId}/playback`)
        .send({
          startPosition: 500,
          endPosition: 2500,
        })
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty('actions');
          // All actions should be within the specified range
          res.body.actions.forEach((action: any) => {
            expect(action.relativeTime).toBeGreaterThanOrEqual(500);
            expect(action.relativeTime).toBeLessThanOrEqual(2500);
          });
        });
    });
  });

  describe('Privacy and Sharing', () => {
    it('PUT /replay/:replayId/privacy - should update privacy level', () => {
      return request(app.getHttpServer())
        .put(`/replay/${replayId}/privacy`)
        .query({ playerId })
        .send({
          privacyLevel: PrivacyLevel.PUBLIC,
        })
        .expect(200)
        .then((res) => {
          expect(res.body.privacyLevel).toBe(PrivacyLevel.PUBLIC);
        });
    });

    it('POST /replay/:replayId/share - should share replay with users', () => {
      return request(app.getHttpServer())
        .post(`/replay/${replayId}/share`)
        .query({ playerId })
        .send({
          userIds: [2, 3, 4],
        })
        .expect(200)
        .then((res) => {
          expect(res.body.privacyLevel).toBe(PrivacyLevel.SHARED);
          expect(res.body.sharedWith).toContain(2);
          expect(res.body.sharedWith).toContain(3);
        });
    });

    it('DELETE /replay/:replayId/share/:userId - should revoke access', () => {
      return request(app.getHttpServer())
        .delete(`/replay/${replayId}/share/2`)
        .query({ playerId })
        .expect(200)
        .then((res) => {
          expect(res.body.sharedWith).not.toContain(2);
        });
    });
  });

  describe('Analytics', () => {
    it('GET /replay/:replayId/analytics - should generate analytics', () => {
      return request(app.getHttpServer())
        .get(`/replay/${replayId}/analytics`)
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty('totalActions');
          expect(res.body).toHaveProperty('totalDuration');
          expect(res.body).toHaveProperty('actionBreakdown');
          expect(res.body).toHaveProperty('hints');
          expect(res.body).toHaveProperty('playerSkillLevel');
          expect(res.body).toHaveProperty('keyInsights');
          expect(Array.isArray(res.body.keyInsights)).toBe(true);
        });
    });
  });

  describe('Error Handling', () => {
    it('GET /replay/nonexistent-id - should return 404 for missing replay', () => {
      return request(app.getHttpServer())
        .get('/replay/nonexistent-id')
        .query({ viewerId: playerId })
        .expect(404);
    });

    it('PUT /replay/:replayId/privacy - should return 403 for non-owner', () => {
      return request(app.getHttpServer())
        .put(`/replay/${replayId}/privacy`)
        .query({ playerId: 999 })
        .send({
          privacyLevel: PrivacyLevel.PRIVATE,
        })
        .expect(403);
    });
  });
});
