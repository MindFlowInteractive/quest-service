import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSession } from '../../src/game-session/entities/game-session.entity';
import { Spectator } from '../../src/game-session/entities/spectator.entity';

describe('Spectator API (e2e)', () => {
  let app: INestApplication;
  let sessionRepo: Repository<GameSession>;
  let spectatorRepo: Repository<Spectator>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    sessionRepo = moduleFixture.get<Repository<GameSession>>(getRepositoryToken(GameSession));
    spectatorRepo = moduleFixture.get<Repository<Spectator>>(getRepositoryToken(Spectator));
  });

  afterEach(async () => {
    await spectatorRepo.clear();
    await sessionRepo.clear();
    await app.close();
  });

  describe('/game-sessions/:id/spectate (POST)', () => {
    it('should allow user to join as spectator', async () => {
      // Create a test session
      const session = sessionRepo.create({
        userId: 'owner-1',
        status: 'IN_PROGRESS',
        isSpectatorAllowed: true,
      });
      const savedSession = await sessionRepo.save(session);

      const response = await request(app.getHttpServer())
        .post(`/game-sessions/${savedSession.id}/spectate`)
        .send({
          userId: 'spectator-1',
          username: 'testspectator',
        })
        .expect(201);

      expect(response.body.message).toBe('Joined session as spectator');
      expect(response.body.spectator).toMatchObject({
        userId: 'spectator-1',
        username: 'testspectator',
        sessionId: savedSession.id,
        isActive: true,
      });
    });

    it('should return 404 for non-existent session', async () => {
      await request(app.getHttpServer())
        .post('/game-sessions/non-existent/spectate')
        .send({
          userId: 'spectator-1',
          username: 'testspectator',
        })
        .expect(404);
    });

    it('should return 403 when spectating is not allowed', async () => {
      const session = sessionRepo.create({
        userId: 'owner-1',
        status: 'IN_PROGRESS',
        isSpectatorAllowed: false,
      });
      const savedSession = await sessionRepo.save(session);

      await request(app.getHttpServer())
        .post(`/game-sessions/${savedSession.id}/spectate`)
        .send({
          userId: 'spectator-1',
          username: 'testspectator',
        })
        .expect(403);
    });
  });

  describe('/game-sessions/:id/spectate (DELETE)', () => {
    it('should allow spectator to leave', async () => {
      // Create session and spectator
      const session = sessionRepo.create({
        userId: 'owner-1',
        status: 'IN_PROGRESS',
        isSpectatorAllowed: true,
      });
      const savedSession = await sessionRepo.save(session);

      const spectator = spectatorRepo.create({
        userId: 'spectator-1',
        username: 'testspectator',
        sessionId: savedSession.id,
        isActive: true,
      });
      await spectatorRepo.save(spectator);

      const response = await request(app.getHttpServer())
        .delete(`/game-sessions/${savedSession.id}/spectate?userId=spectator-1`)
        .expect(200);

      expect(response.body.message).toBe('Left spectator view');
    });

    it('should return 404 if not spectating', async () => {
      const session = sessionRepo.create({
        userId: 'owner-1',
        status: 'IN_PROGRESS',
        isSpectatorAllowed: true,
      });
      const savedSession = await sessionRepo.save(session);

      await request(app.getHttpServer())
        .delete(`/game-sessions/${savedSession.id}/spectate?userId=non-spectator`)
        .expect(404);
    });
  });

  describe('/game-sessions/:id/spectators (GET)', () => {
    it('should return active spectators', async () => {
      // Create session
      const session = sessionRepo.create({
        userId: 'owner-1',
        status: 'IN_PROGRESS',
        isSpectatorAllowed: true,
      });
      const savedSession = await sessionRepo.save(session);

      // Create spectators
      const spectator1 = spectatorRepo.create({
        userId: 'spectator-1',
        username: 'testspectator1',
        sessionId: savedSession.id,
        isActive: true,
      });
      const spectator2 = spectatorRepo.create({
        userId: 'spectator-2',
        username: 'testspectator2',
        sessionId: savedSession.id,
        isActive: true,
      });
      await spectatorRepo.save([spectator1, spectator2]);

      const response = await request(app.getHttpServer())
        .get(`/game-sessions/${savedSession.id}/spectators`)
        .expect(200);

      expect(response.body.message).toBe('Active spectators retrieved');
      expect(response.body.count).toBe(2);
      expect(response.body.spectators).toHaveLength(2);
      expect(response.body.spectators.map(s => s.userId)).toContain('spectator-1');
      expect(response.body.spectators.map(s => s.userId)).toContain('spectator-2');
    });

    it('should return empty list for no spectators', async () => {
      const session = sessionRepo.create({
        userId: 'owner-1',
        status: 'IN_PROGRESS',
        isSpectatorAllowed: true,
      });
      const savedSession = await sessionRepo.save(session);

      const response = await request(app.getHttpServer())
        .get(`/game-sessions/${savedSession.id}/spectators`)
        .expect(200);

      expect(response.body.count).toBe(0);
      expect(response.body.spectators).toHaveLength(0);
    });
  });

  describe('/game-sessions/:id/spectate/toggle (PATCH)', () => {
    it('should allow owner to enable spectating', async () => {
      const session = sessionRepo.create({
        userId: 'owner-1',
        status: 'IN_PROGRESS',
        isSpectatorAllowed: false,
      });
      const savedSession = await sessionRepo.save(session);

      const response = await request(app.getHttpServer())
        .patch(`/game-sessions/${savedSession.id}/spectate/toggle?userId=owner-1`)
        .send({ spectatingAllowed: true })
        .expect(200);

      expect(response.body.message).toBe('Spectating enabled');
      expect(response.body.session.isSpectatorAllowed).toBe(true);
    });

    it('should allow owner to disable spectating', async () => {
      const session = sessionRepo.create({
        userId: 'owner-1',
        status: 'IN_PROGRESS',
        isSpectatorAllowed: true,
      });
      const savedSession = await sessionRepo.save(session);

      const response = await request(app.getHttpServer())
        .patch(`/game-sessions/${savedSession.id}/spectate/toggle?userId=owner-1`)
        .send({ spectatingAllowed: false })
        .expect(200);

      expect(response.body.message).toBe('Spectating disabled');
      expect(response.body.session.isSpectatorAllowed).toBe(false);
    });

    it('should return 403 if not owner', async () => {
      const session = sessionRepo.create({
        userId: 'owner-1',
        status: 'IN_PROGRESS',
        isSpectatorAllowed: true,
      });
      const savedSession = await sessionRepo.save(session);

      await request(app.getHttpServer())
        .patch(`/game-sessions/${savedSession.id}/spectate/toggle?userId=other-user`)
        .send({ spectatingAllowed: false })
        .expect(403);
    });

    it('should remove all spectators when disabling', async () => {
      const session = sessionRepo.create({
        userId: 'owner-1',
        status: 'IN_PROGRESS',
        isSpectatorAllowed: true,
      });
      const savedSession = await sessionRepo.save(session);

      // Create spectators
      const spectator = spectatorRepo.create({
        userId: 'spectator-1',
        username: 'testspectator',
        sessionId: savedSession.id,
        isActive: true,
      });
      await spectatorRepo.save(spectator);

      await request(app.getHttpServer())
        .patch(`/game-sessions/${savedSession.id}/spectate/toggle?userId=owner-1`)
        .send({ spectatingAllowed: false })
        .expect(200);

      // Verify spectators are removed
      const activeSpectators = await spectatorRepo.find({
        where: { sessionId: savedSession.id, isActive: true },
      });
      expect(activeSpectators).toHaveLength(0);
    });
  });
});
