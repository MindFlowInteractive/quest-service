import { Test, TestingModule } from '@nestjs/testing';
import { MultiplayerService } from '../services/multiplayer.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RoomType, RoomStatus, Player } from '../interfaces/multiplayer.interface';

describe('MultiplayerService', () => {
  let service: MultiplayerService;
  let cacheManager: jest.Mocked<Cache>;

  const mockPlayer: Player = {
    id: 'user1',
    username: 'testuser',
    skillLevel: 5,
    ready: false,
    score: 0,
    solvedPuzzles: [],
  };

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiplayerService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<MultiplayerService>(MultiplayerService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMultiplayerSession', () => {
    it('should create a collaborative session with invite code', async () => {
      const settings = { maxPlayers: 4, timeLimit: 600 };
      
      const session = await service.createMultiplayerSession(
        RoomType.COLLABORATIVE,
        mockPlayer,
        settings,
        'puzzle1'
      );

      expect(session.id).toBeDefined();
      expect(session.inviteCode).toBeDefined();
      expect(session.inviteCode).toHaveLength(6);
      expect(session.type).toBe(RoomType.COLLABORATIVE);
      expect(session.status).toBe(RoomStatus.LOBBY);
      expect(session.players).toHaveLength(1);
      expect(session.players[0]).toEqual(mockPlayer);
      expect(session.puzzleId).toBe('puzzle1');
      expect(session.settings.maxPlayers).toBe(4);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `session:${session.inviteCode}`,
        session,
        3600
      );
      expect(cacheManager.set).toHaveBeenCalledWith(
        `session:id:${session.id}`,
        session,
        3600
      );
    });

    it('should create a competitive session with default settings', async () => {
      const session = await service.createMultiplayerSession(
        RoomType.COMPETITIVE,
        mockPlayer
      );

      expect(session.type).toBe(RoomType.COMPETITIVE);
      expect(session.settings.maxPlayers).toBe(4);
      expect(session.settings.minPlayers).toBe(2);
      expect(session.settings.timeLimit).toBe(600);
      expect(session.settings.difficulty).toBe('medium');
      expect(session.settings.spectatingAllowed).toBe(true);
    });
  });

  describe('joinSessionByCode', () => {
    let existingSession: any;

    beforeEach(async () => {
      existingSession = await service.createMultiplayerSession(
        RoomType.COLLABORATIVE,
        mockPlayer
      );
    });

    it('should allow player to join session by invite code', async () => {
      const newPlayer: Player = {
        ...mockPlayer,
        id: 'user2',
        username: 'testuser2',
      };

      cacheManager.get.mockResolvedValue(existingSession);

      const joinedSession = await service.joinSessionByCode(
        existingSession.inviteCode,
        newPlayer
      );

      expect(joinedSession).toBeTruthy();
      expect(joinedSession?.players).toHaveLength(2);
      expect(joinedSession?.players.some(p => p.id === 'user2')).toBe(true);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `session:${existingSession.inviteCode}`,
        expect.any(Object),
        3600
      );
    });

    it('should reject join for invalid invite code', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.joinSessionByCode('INVALID', mockPlayer);

      expect(result).toBeNull();
    });

    it('should reject join for full session', async () => {
      const fullSession = {
        ...existingSession,
        players: Array(4).fill(mockPlayer), // Max players reached
        settings: { ...existingSession.settings, maxPlayers: 4 },
      };

      cacheManager.get.mockResolvedValue(fullSession);

      const result = await service.joinSessionByCode(
        existingSession.inviteCode,
        mockPlayer
      );

      expect(result).toBeNull();
    });

    it('should reject join for session already playing', async () => {
      const playingSession = {
        ...existingSession,
        status: RoomStatus.PLAYING,
      };

      cacheManager.get.mockResolvedValue(playingSession);

      const result = await service.joinSessionByCode(
        existingSession.inviteCode,
        mockPlayer
      );

      expect(result).toBeNull();
    });
  });

  describe('getSessionByCode', () => {
    it('should retrieve session from Redis', async () => {
      const session = await service.createMultiplayerSession(
        RoomType.COLLABORATIVE,
        mockPlayer
      );

      cacheManager.get.mockResolvedValue(session);

      const result = await service.getSessionByCode(session.inviteCode);

      expect(result).toEqual(session);
      expect(cacheManager.get).toHaveBeenCalledWith(`session:${session.inviteCode}`);
    });

    it('should return null for non-existent session', async () => {
      cacheManager.get.mockResolvedValue(null);

      const result = await service.getSessionByCode('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('handlePlayerReconnection', () => {
    let session: any;

    beforeEach(async () => {
      session = await service.createMultiplayerSession(
        RoomType.COLLABORATIVE,
        mockPlayer
      );
    });

    it('should allow reconnection within grace period', async () => {
      // Simulate player disconnection
      await service.handlePlayerDisconnection(session.id, mockPlayer.id);

      const result = await service.handlePlayerReconnection(session.id, mockPlayer.id);

      expect(result).toBeTruthy();
      expect(result?.disconnectedPlayers?.has(mockPlayer.id)).toBe(false);
    });

    it('should reject reconnection after grace period', async () => {
      // Simulate disconnection with old timestamp
      session.disconnectedPlayers?.set(mockPlayer.id, new Date(Date.now() - 120000)); // 2 minutes ago

      const result = await service.handlePlayerReconnection(session.id, mockPlayer.id);

      expect(result).toBeNull();
    });

    it('should reject reconnection for non-existent session', async () => {
      const result = await service.handlePlayerReconnection('nonexistent', mockPlayer.id);

      expect(result).toBeNull();
    });
  });

  describe('handlePlayerDisconnection', () => {
    let session: any;

    beforeEach(async () => {
      session = await service.createMultiplayerSession(
        RoomType.COLLABORATIVE,
        mockPlayer
      );
    });

    it('should track disconnected player with timestamp', async () => {
      await service.handlePlayerDisconnection(session.id, mockPlayer.id);

      expect(session.disconnectedPlayers?.has(mockPlayer.id)).toBe(true);
      expect(session.disconnectedPlayers?.get(mockPlayer.id)).toBeInstanceOf(Date);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `session:${session.inviteCode}`,
        session,
        3600
      );
    });

    it('should handle disconnection for non-existent session', async () => {
      // Should not throw error
      await expect(
        service.handlePlayerDisconnection('nonexistent', mockPlayer.id)
      ).resolves.toBeUndefined();
    });
  });

  describe('invite code generation', () => {
    it('should generate unique invite codes', async () => {
      const codes = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const session = await service.createMultiplayerSession(
          RoomType.COLLABORATIVE,
          { ...mockPlayer, id: `user${i}` }
        );
        codes.add(session.inviteCode);
      }

      expect(codes.size).toBe(100); // All codes should be unique
    });

    it('should generate 6-character alphanumeric codes', async () => {
      const session = await service.createMultiplayerSession(
        RoomType.COLLABORATIVE,
        mockPlayer
      );

      expect(session.inviteCode).toMatch(/^[A-Z0-9]{6}$/);
    });
  });
});
