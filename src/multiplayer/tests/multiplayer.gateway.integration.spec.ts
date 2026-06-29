import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server } from 'socket.io';
import { createSocket } from 'socket.io-client';
import { MultiplayerGateway } from '../gateways/multiplayer.gateway';
import { MultiplayerService } from '../services/multiplayer.service';
import { ValidationService } from '../../game-engine/services/validation.service';
import { LeaderboardService } from '../../leaderboard/leaderboard.service';
import { PuzzlesService } from '../../puzzles/puzzles.service';
import { SpectatorService } from '../../game-session/services/spectator.service';
import { RoomType, RoomStatus } from '../interfaces/multiplayer.interface';

describe('MultiplayerGateway Integration', () => {
  let app: INestApplication;
  let server: Server;
  let gateway: MultiplayerGateway;
  let multiplayerService: MultiplayerService;
  let clientSocket: any;
  let clientSocket2: any;

  const mockPlayer1 = {
    id: 'user1',
    username: 'testuser1',
    skillLevel: 5,
  };

  const mockPlayer2 = {
    id: 'user2',
    username: 'testuser2',
    skillLevel: 6,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiplayerGateway,
        {
          provide: MultiplayerService,
          useValue: {
            createMultiplayerSession: jest.fn(),
            joinSessionByCode: jest.fn(),
            handlePlayerReconnection: jest.fn(),
            handlePlayerDisconnection: jest.fn(),
            getRoom: jest.fn(),
            removeFromQueue: jest.fn(),
          },
        },
        {
          provide: ValidationService,
          useValue: {
            validateSolution: jest.fn(),
          },
        },
        {
          provide: LeaderboardService,
          useValue: {
            createEntry: jest.fn(),
          },
        },
        {
          provide: PuzzlesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: SpectatorService,
          useValue: {
            joinSession: jest.fn(),
            leaveSession: jest.fn(),
            getActiveSpectators: jest.fn(),
            getSpectatorCount: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    
    gateway = module.get<MultiplayerGateway>(MultiplayerGateway);
    multiplayerService = module.get<MultiplayerService>(MultiplayerService);

    await app.listen(0);
    const httpServer = app.getHttpServer();
    const port = httpServer.address().port;

    // Create test clients
    clientSocket = createSocket(`http://localhost:${port}`, {
      path: '/socket.io/',
      query: { EIO: '4', transport: 'websocket' },
    });

    clientSocket2 = createSocket(`http://localhost:${port}`, {
      path: '/socket.io/',
      query: { EIO: '4', transport: 'websocket' },
    });

    await new Promise<void>((resolve) => {
      clientSocket.on('connect', resolve);
    });

    await new Promise<void>((resolve) => {
      clientSocket2.on('connect', resolve);
    });
  });

  afterAll(async () => {
    clientSocket?.disconnect();
    clientSocket2?.disconnect();
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Multiplayer Session Creation', () => {
    it('should create collaborative session and emit event', (done) => {
      const mockSession = {
        id: 'session1',
        inviteCode: 'ABC123',
        type: RoomType.COLLABORATIVE,
        status: RoomStatus.LOBBY,
        players: [mockPlayer1],
        settings: { maxPlayers: 4, timeLimit: 600 },
      };

      (multiplayerService.createMultiplayerSession as jest.Mock).mockResolvedValue(mockSession);

      clientSocket.emit('createMultiplayerSession', {
        userId: mockPlayer1.id,
        username: mockPlayer1.username,
        skillLevel: mockPlayer1.skillLevel,
        type: RoomType.COLLABORATIVE,
        settings: { maxPlayers: 4 },
        puzzleId: 'puzzle1',
      });

      clientSocket.on('multiplayerSessionCreated', (data: any) => {
        expect(data).toEqual(mockSession);
        expect(multiplayerService.createMultiplayerSession).toHaveBeenCalledWith(
          RoomType.COLLABORATIVE,
          expect.objectContaining({
            id: mockPlayer1.id,
            username: mockPlayer1.username,
            skillLevel: mockPlayer1.skillLevel,
          }),
          { maxPlayers: 4 },
          'puzzle1'
        );
        done();
      });
    });

    it('should create competitive session', (done) => {
      const mockSession = {
        id: 'session2',
        inviteCode: 'XYZ789',
        type: RoomType.COMPETITIVE,
        status: RoomStatus.LOBBY,
        players: [mockPlayer1],
        settings: { maxPlayers: 2, timeLimit: 300 },
      };

      (multiplayerService.createMultiplayerSession as jest.Mock).mockResolvedValue(mockSession);

      clientSocket.emit('createMultiplayerSession', {
        userId: mockPlayer1.id,
        username: mockPlayer1.username,
        skillLevel: mockPlayer1.skillLevel,
        type: RoomType.COMPETITIVE,
      });

      clientSocket.on('multiplayerSessionCreated', (data: any) => {
        expect(data.type).toBe(RoomType.COMPETITIVE);
        done();
      });
    });
  });

  describe('Session Join by Invite Code', () => {
    it('should allow player to join session by invite code', (done) => {
      const mockSession = {
        id: 'session1',
        inviteCode: 'ABC123',
        type: RoomType.COLLABORATIVE,
        status: RoomStatus.LOBBY,
        players: [mockPlayer1, mockPlayer2],
        settings: { maxPlayers: 4 },
      };

      (multiplayerService.joinSessionByCode as jest.Mock).mockResolvedValue(mockSession);

      clientSocket2.emit('joinSessionByCode', {
        inviteCode: 'ABC123',
        userId: mockPlayer2.id,
        username: mockPlayer2.username,
        skillLevel: mockPlayer2.skillLevel,
      });

      clientSocket2.on('joinedSessionByCode', (data: any) => {
        expect(data).toEqual(mockSession);
        expect(multiplayerService.joinSessionByCode).toHaveBeenCalledWith(
          'ABC123',
          expect.objectContaining({
            id: mockPlayer2.id,
            username: mockPlayer2.username,
          })
        );
        done();
      });
    });

    it('should emit error for invalid invite code', (done) => {
      (multiplayerService.joinSessionByCode as jest.Mock).mockResolvedValue(null);

      clientSocket2.emit('joinSessionByCode', {
        inviteCode: 'INVALID',
        userId: mockPlayer2.id,
        username: mockPlayer2.username,
        skillLevel: mockPlayer2.skillLevel,
      });

      clientSocket2.on('error', (data: any) => {
        expect(data).toBe('Failed to join session - invalid code or session full');
        done();
      });
    });
  });

  describe('Player Reconnection', () => {
    it('should allow player reconnection within grace period', (done) => {
      const mockSession = {
        id: 'session1',
        inviteCode: 'ABC123',
        players: [mockPlayer1],
      };

      (multiplayerService.handlePlayerReconnection as jest.Mock).mockResolvedValue(mockSession);

      clientSocket.emit('reconnectToSession', {
        roomId: 'session1',
        userId: mockPlayer1.id,
      });

      clientSocket.on('reconnectedToSession', (data: any) => {
        expect(data).toEqual(mockSession);
        expect(multiplayerService.handlePlayerReconnection).toHaveBeenCalledWith(
          'session1',
          mockPlayer1.id
        );
        done();
      });
    });

    it('should emit error for expired grace period', (done) => {
      (multiplayerService.handlePlayerReconnection as jest.Mock).mockResolvedValue(null);

      clientSocket.emit('reconnectToSession', {
        roomId: 'session1',
        userId: mockPlayer1.id,
      });

      clientSocket.on('error', (data: any) => {
        expect(data).toBe('Failed to reconnect - grace period expired');
        done();
      });
    });
  });

  describe('Collaborative Game Mode', () => {
    it('should handle collaborative state updates', (done) => {
      const mockRoom = {
        id: 'session1',
        type: RoomType.COLLABORATIVE,
        puzzleState: { grid: [[1, 2], [3, 4]] },
      };

      (multiplayerService.getRoom as jest.Mock).mockReturnValue(mockRoom);

      clientSocket.emit('updateCollaborativeState', {
        roomId: 'session1',
        state: { grid: [[1, 2], [3, 4]] },
        userId: mockPlayer1.id,
      });

      clientSocket.on('collaborativeStateUpdated', (data: any) => {
        expect(data.state).toEqual({
          grid: [[1, 2], [3, 4]],
          lastUpdatedBy: mockPlayer1.id,
        });
        expect(data.updatedBy).toBe(mockPlayer1.id);
        expect(data.timestamp).toBeDefined();
        done();
      });
    });
  });

  describe('Solution Submission', () => {
    it('should handle collaborative solution verification', (done) => {
      const mockRoom = {
        id: 'session1',
        type: RoomType.COLLABORATIVE,
        status: RoomStatus.PLAYING,
        players: [
          { ...mockPlayer1, solvedPuzzles: ['puzzle1'] },
          { ...mockPlayer2, solvedPuzzles: ['puzzle1'] },
        ],
      };

      const mockPuzzle = {
        id: 'puzzle1',
        content: { type: 'sudoku', difficulty: 'medium' },
      };

      const mockValidationResult = {
        isValid: true,
        score: 100,
        errors: [],
      };

      (multiplayerService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (multiplayerService['cacheManager'] = { set: jest.fn() });
      (multiplayerService as any).puzzlesService = { findOne: jest.fn().mockResolvedValue(mockPuzzle) };
      (multiplayerService as any).validationService = { 
        validateSolution: jest.fn().mockResolvedValue(mockValidationResult) 
      };

      clientSocket.emit('submitSolution', {
        roomId: 'session1',
        userId: mockPlayer1.id,
        puzzleId: 'puzzle1',
        solution: { grid: [[1, 2], [3, 4]] },
      });

      clientSocket.on('collaborativeSolutionVerified', (data: any) => {
        expect(data.userId).toBe(mockPlayer1.id);
        expect(data.correct).toBe(true);
        expect(data.score).toBe(100);
        expect(data.allPlayersSolved).toBe(true);
        expect(data.puzzleCompleted).toBe(true);
        done();
      });
    });

    it('should handle competitive solution verification', (done) => {
      const mockRoom = {
        id: 'session1',
        type: RoomType.COMPETITIVE,
        status: RoomStatus.PLAYING,
        players: [
          { ...mockPlayer1, score: 150, solvedPuzzles: ['puzzle1'] },
          { ...mockPlayer2, score: 100, solvedPuzzles: [] },
        ],
        startTime: new Date(Date.now() - 60000), // 1 minute ago
        settings: { timeLimit: 600 },
      };

      const mockPuzzle = { id: 'puzzle1', content: { type: 'sudoku' } };
      const mockValidationResult = { isValid: true, score: 50, errors: [] };

      (multiplayerService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (multiplayerService['cacheManager'] = { set: jest.fn() });
      (multiplayerService as any).puzzlesService = { findOne: jest.fn().mockResolvedValue(mockPuzzle) };
      (multiplayerService as any).validationService = { 
        validateSolution: jest.fn().mockResolvedValue(mockValidationResult) 
      };
      (multiplayerService as any).leaderboardService = { createEntry: jest.fn() };

      clientSocket.emit('submitSolution', {
        roomId: 'session1',
        userId: mockPlayer2.id,
        puzzleId: 'puzzle1',
        solution: { grid: [[1, 2], [3, 4]] },
      });

      clientSocket.on('competitiveSolutionVerified', (data: any) => {
        expect(data.userId).toBe(mockPlayer2.id);
        expect(data.correct).toBe(true);
        expect(data.score).toBe(50);
        expect(data.leaderboard).toBeDefined();
        expect(data.leaderboard).toHaveLength(2);
        expect(data.leaderboard[0].score).toBe(150); // Player 1 still leading
        done();
      });
    });
  });

  describe('Connection Handling', () => {
    it('should handle player disconnection', (done) => {
      clientSocket.data.userId = mockPlayer1.id;
      clientSocket.data.roomId = 'session1';

      clientSocket.disconnect();

      // Verify service was called
      setTimeout(() => {
        expect(multiplayerService.handlePlayerDisconnection).toHaveBeenCalledWith(
          'session1',
          mockPlayer1.id
        );
        done();
      }, 100);
    });

    it('should remove player from queue on disconnect', () => {
      clientSocket.data.userId = mockPlayer1.id;
      clientSocket.disconnect();

      expect(multiplayerService.removeFromQueue).toHaveBeenCalledWith(mockPlayer1.id);
    });
  });
});
