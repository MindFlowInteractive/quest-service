import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpectatorService } from '../../src/game-session/services/spectator.service';
import { Spectator } from '../../src/game-session/entities/spectator.entity';
import { GameSession } from '../../src/game-session/entities/game-session.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('SpectatorService', () => {
  let service: SpectatorService;
  let spectatorRepo: Repository<Spectator>;
  let sessionRepo: Repository<GameSession>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpectatorService,
        {
          provide: getRepositoryToken(Spectator),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GameSession),
          useValue: {
            findOneBy: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SpectatorService>(SpectatorService);
    spectatorRepo = module.get<Repository<Spectator>>(getRepositoryToken(Spectator));
    sessionRepo = module.get<Repository<GameSession>>(getRepositoryToken(GameSession));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('joinSession', () => {
    it('should successfully join a session as spectator', async () => {
      const session = { id: 'session-1', isSpectatorAllowed: true };
      const spectatorData = { userId: 'user-1', username: 'testuser' };
      const expectedSpectator = { id: 'spectator-1', ...spectatorData, sessionId: 'session-1', joinedAt: new Date(), isActive: true };

      sessionRepo.findOneBy.mockResolvedValue(session);
      spectatorRepo.findOne.mockResolvedValue(null);
      spectatorRepo.create.mockReturnValue(expectedSpectator);
      spectatorRepo.save.mockResolvedValue(expectedSpectator);

      const result = await service.joinSession('session-1', spectatorData);

      expect(result).toEqual(expectedSpectator);
      expect(sessionRepo.findOneBy).toHaveBeenCalledWith({ id: 'session-1' });
      expect(spectatorRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        username: 'testuser',
        sessionId: 'session-1',
        joinedAt: expect.any(Date),
        isActive: true,
      });
    });

    it('should throw NotFoundException if session does not exist', async () => {
      sessionRepo.findOneBy.mockResolvedValue(null);

      await expect(service.joinSession('nonexistent', { userId: 'user-1', username: 'test' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if spectating is not allowed', async () => {
      const session = { id: 'session-1', isSpectatorAllowed: false };
      sessionRepo.findOneBy.mockResolvedValue(session);

      await expect(service.joinSession('session-1', { userId: 'user-1', username: 'test' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('should return existing spectator if already spectating', async () => {
      const session = { id: 'session-1', isSpectatorAllowed: true };
      const existingSpectator = { id: 'spectator-1', userId: 'user-1', username: 'test', isActive: true };

      sessionRepo.findOneBy.mockResolvedValue(session);
      spectatorRepo.findOne.mockResolvedValue(existingSpectator);

      const result = await service.joinSession('session-1', { userId: 'user-1', username: 'test' });

      expect(result).toEqual(existingSpectator);
      expect(spectatorRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('leaveSession', () => {
    it('should successfully leave spectator session', async () => {
      const spectator = { id: 'spectator-1', isActive: true };

      spectatorRepo.findOne.mockResolvedValue(spectator);
      spectatorRepo.save.mockResolvedValue({ ...spectator, isActive: false, leftAt: new Date() });

      await service.leaveSession('session-1', 'user-1');

      expect(spectatorRepo.findOne).toHaveBeenCalledWith({
        where: { sessionId: 'session-1', userId: 'user-1', isActive: true },
      });
      expect(spectatorRepo.save).toHaveBeenCalledWith({
        ...spectator,
        isActive: false,
        leftAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException if not currently spectating', async () => {
      spectatorRepo.findOne.mockResolvedValue(null);

      await expect(service.leaveSession('session-1', 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveSpectators', () => {
    it('should return active spectators for a session', async () => {
      const spectators = [
        { id: 'spectator-1', username: 'user1', isActive: true },
        { id: 'spectator-2', username: 'user2', isActive: true },
      ];

      spectatorRepo.find.mockResolvedValue(spectators);

      const result = await service.getActiveSpectators('session-1');

      expect(result).toEqual(spectators);
      expect(spectatorRepo.find).toHaveBeenCalledWith({
        where: { sessionId: 'session-1', isActive: true },
        order: { joinedAt: 'ASC' },
      });
    });
  });

  describe('getSpectatorCount', () => {
    it('should return spectator count for a session', async () => {
      spectatorRepo.count.mockResolvedValue(3);

      const result = await service.getSpectatorCount('session-1');

      expect(result).toBe(3);
      expect(spectatorRepo.count).toHaveBeenCalledWith({
        where: { sessionId: 'session-1', isActive: true },
      });
    });
  });

  describe('toggleSpectating', () => {
    it('should allow session owner to toggle spectating', async () => {
      const session = { id: 'session-1', userId: 'owner-1', isSpectatorAllowed: false };
      const updatedSession = { ...session, isSpectatorAllowed: true };

      sessionRepo.findOneBy.mockResolvedValue(session);
      sessionRepo.save.mockResolvedValue(updatedSession);

      const result = await service.toggleSpectating('session-1', 'owner-1', true);

      expect(result).toEqual(updatedSession);
      expect(sessionRepo.save).toHaveBeenCalledWith({ ...session, isSpectatorAllowed: true });
    });

    it('should throw ForbiddenException if not session owner', async () => {
      const session = { id: 'session-1', userId: 'owner-1' };

      sessionRepo.findOneBy.mockResolvedValue(session);

      await expect(service.toggleSpectating('session-1', 'other-user', true))
        .rejects.toThrow(ForbiddenException);
    });

    it('should remove all spectators when disabling spectating', async () => {
      const session = { id: 'session-1', userId: 'owner-1', isSpectatorAllowed: true };

      sessionRepo.findOneBy.mockResolvedValue(session);
      sessionRepo.save.mockResolvedValue({ ...session, isSpectatorAllowed: false });
      spectatorRepo.update.mockResolvedValue({});

      await service.toggleSpectating('session-1', 'owner-1', false);

      expect(spectatorRepo.update).toHaveBeenCalledWith(
        { sessionId: 'session-1', isActive: true },
        { isActive: false, leftAt: expect.any(Date) }
      );
    });
  });

  describe('isUserSpectating', () => {
    it('should return true if user is spectating', async () => {
      const spectator = { id: 'spectator-1', isActive: true };
      spectatorRepo.findOne.mockResolvedValue(spectator);

      const result = await service.isUserSpectating('session-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false if user is not spectating', async () => {
      spectatorRepo.findOne.mockResolvedValue(null);

      const result = await service.isUserSpectating('session-1', 'user-1');

      expect(result).toBe(false);
    });
  });
});
