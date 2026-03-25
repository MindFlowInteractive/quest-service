import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import { MultiplayerGateway } from '../../src/multiplayer/gateways/multiplayer.gateway';
import { MultiplayerService } from '../../src/multiplayer/services/multiplayer.service';
import { SpectatorService } from '../../src/game-session/services/spectator.service';
import { ValidationService } from '../../src/game-engine/services/validation.service';
import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import { PuzzlesService } from '../../src/puzzles/puzzles.service';
import { RoomType, RoomStatus } from '../../src/multiplayer/interfaces/multiplayer.interface';

describe('MultiplayerGateway Spectator Features', () => {
  let gateway: MultiplayerGateway;
  let multiplayerService: MultiplayerService;
  let spectatorService: SpectatorService;
  let server: Server;
  let mockClient: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiplayerGateway,
        {
          provide: MultiplayerService,
          useValue: {
            createRoom: jest.fn(),
            joinRoom: jest.fn(),
            getRoom: jest.fn(),
            setPlayerReady: jest.fn(),
            updatePuzzleState: jest.fn(),
            addSpectator: jest.fn(),
            removeSpectator: jest.fn(),
            toggleSpectating: jest.fn(),
            getSpectatorCount: jest.fn(),
            isUserSpectating: jest.fn(),
          },
        },
        {
          provide: SpectatorService,
          useValue: {
            joinSession: jest.fn(),
            leaveSession: jest.fn(),
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
      ],
    }).compile();

    gateway = module.get<MultiplayerGateway>(MultiplayerGateway);
    multiplayerService = module.get<MultiplayerService>(MultiplayerService);
    spectatorService = module.get<SpectatorService>(SpectatorService);
    
    server = new Server();
    gateway['server'] = server;

    mockClient = {
      id: 'client-1',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn(() => mockClient),
      data: {},
    };
  });

  describe('Spectator WebSocket Events', () => {
    describe('spectate event', () => {
      it('should allow user to join as spectator', async () => {
        const room = {
          id: 'room-1',
          players: [],
          spectators: [],
          settings: { spectatingAllowed: true },
        };
        const spectator = {
          id: 'spectator-1',
          userId: 'user-1',
          username: 'testspectator',
          joinedAt: new Date(),
          isActive: true,
        };

        multiplayerService.addSpectator.mockReturnValue(room);
        multiplayerService.getSpectatorCount.mockReturnValue(1);

        const result = await gateway.handleSpectate(mockClient, {
          roomId: 'room-1',
          userId: 'user-1',
          username: 'testspectator',
        });

        expect(mockClient.join).toHaveBeenCalledWith('room-1-spectators');
        expect(mockClient.data.isSpectator).toBe(true);
        expect(mockClient.data.roomId).toBe('room-1');
        expect(result.event).toBe('spectatingStarted');
        expect(mockClient.emit).toHaveBeenCalledWith('spectatorJoined', { room, spectator });
      });

      it('should return error if spectating not allowed', async () => {
        multiplayerService.addSpectator.mockReturnValue(null);

        const result = await gateway.handleSpectate(mockClient, {
          roomId: 'room-1',
          userId: 'user-1',
          username: 'testspectator',
        });

        expect(result.event).toBe('error');
        expect(result.data).toBe('Could not join as spectator');
      });
    });

    describe('leaveSpectate event', () => {
      it('should allow spectator to leave', async () => {
        const room = {
          id: 'room-1',
          players: [],
          spectators: [],
        };

        multiplayerService.removeSpectator.mockReturnValue(room);
        multiplayerService.getSpectatorCount.mockReturnValue(0);

        mockClient.data.isSpectator = true;
        mockClient.data.roomId = 'room-1';

        const result = await gateway.handleLeaveSpectate(mockClient, {
          roomId: 'room-1',
          userId: 'user-1',
        });

        expect(mockClient.leave).toHaveBeenCalledWith('room-1-spectators');
        expect(mockClient.data.isSpectator).toBe(false);
        expect(result.event).toBe('spectatingEnded');
      });

      it('should return error if not spectating', async () => {
        multiplayerService.removeSpectator.mockReturnValue(null);

        const result = await gateway.handleLeaveSpectate(mockClient, {
          roomId: 'room-1',
          userId: 'user-1',
        });

        expect(result.event).toBe('error');
        expect(result.data).toBe('Not currently spectating');
      });
    });

    describe('toggleSpectating event', () => {
      it('should allow toggling spectating', async () => {
        const room = {
          id: 'room-1',
          players: [],
          spectators: [],
          settings: { spectatingAllowed: false },
        };

        multiplayerService.toggleSpectating.mockReturnValue(room);
        server['in'] = jest.fn(() => ({
          socketsLeave: jest.fn(),
        }));

        const result = await gateway.handleToggleSpectating(mockClient, {
          roomId: 'room-1',
          userId: 'user-1',
          spectatingAllowed: false,
        });

        expect(result.event).toBe('spectatingToggled');
        expect(result.data.spectatingAllowed).toBe(false);
      });
    });
  });

  describe('Spectator Restrictions', () => {
    describe('updatePuzzleState', () => {
      it('should prevent spectators from updating puzzle state', async () => {
        mockClient.data.isSpectator = true;

        await gateway.handleUpdatePuzzleState(mockClient, {
          roomId: 'room-1',
          state: { some: 'data' },
        });

        expect(mockClient.emit).toHaveBeenCalledWith('error', 'Spectators cannot update puzzle state');
        expect(multiplayerService.updatePuzzleState).not.toHaveBeenCalled();
      });

      it('should allow players to update puzzle state', async () => {
        mockClient.data.isSpectator = false;
        const room = { id: 'room-1' };
        multiplayerService.updatePuzzleState.mockReturnValue(room);
        multiplayerService.getSpectatorCount.mockReturnValue(1);

        await gateway.handleUpdatePuzzleState(mockClient, {
          roomId: 'room-1',
          state: { some: 'data' },
        });

        expect(multiplayerService.updatePuzzleState).toHaveBeenCalledWith('room-1', { some: 'data' });
        expect(mockClient.to).toHaveBeenCalledWith('room-1');
      });
    });

    describe('submitSolution', () => {
      it('should prevent spectators from submitting solutions', async () => {
        mockClient.data.isSpectator = true;

        await gateway.handleSubmitSolution(mockClient, {
          roomId: 'room-1',
          userId: 'user-1',
          puzzleId: 'puzzle-1',
          solution: { answer: 'test' },
        });

        expect(mockClient.emit).toHaveBeenCalledWith('error', 'Spectators cannot submit solutions');
        expect(multiplayerService.getRoom).not.toHaveBeenCalled();
      });

      it('should allow players to submit solutions', async () => {
        mockClient.data.isSpectator = false;
        const room = {
          id: 'room-1',
          status: RoomStatus.PLAYING,
          players: [{ id: 'user-1', score: 0, solvedPuzzles: [] }],
        };
        const puzzle = { id: 'puzzle-1', content: { type: 'test' } };

        multiplayerService.getRoom.mockReturnValue(room);
        jest.spyOn(gateway['puzzlesService'], 'findOne').mockResolvedValue(puzzle);
        jest.spyOn(gateway['validationService'], 'validateSolution').mockResolvedValue({
          isValid: true,
          score: 100,
        });

        await gateway.handleSubmitSolution(mockClient, {
          roomId: 'room-1',
          userId: 'user-1',
          puzzleId: 'puzzle-1',
          solution: { answer: 'test' },
        });

        expect(multiplayerService.getRoom).toHaveBeenCalledWith('room-1');
      });
    });

    describe('ready', () => {
      it('should prevent spectators from changing ready status', async () => {
        mockClient.data.isSpectator = true;

        await gateway.handleReady(mockClient, {
          roomId: 'room-1',
          userId: 'user-1',
          ready: true,
        });

        expect(mockClient.emit).toHaveBeenCalledWith('error', 'Spectators cannot change ready status');
        expect(multiplayerService.setPlayerReady).not.toHaveBeenCalled();
      });

      it('should allow players to change ready status', async () => {
        mockClient.data.isSpectator = false;
        const room = { id: 'room-1', status: RoomStatus.LOBBY };
        multiplayerService.setPlayerReady.mockReturnValue(room);
        multiplayerService.getSpectatorCount.mockReturnValue(1);

        await gateway.handleReady(mockClient, {
          roomId: 'room-1',
          userId: 'user-1',
          ready: true,
        });

        expect(multiplayerService.setPlayerReady).toHaveBeenCalledWith('room-1', 'user-1', true);
      });
    });

    describe('joinRoom', () => {
      it('should prevent spectators from joining as players', async () => {
        mockClient.data.isSpectator = true;

        await gateway.handleJoinRoom(mockClient, {
          roomId: 'room-1',
          userId: 'user-1',
          username: 'testuser',
          skillLevel: 5,
        });

        expect(mockClient.emit).toHaveBeenCalledWith('error', 'Spectators cannot join as players');
        expect(multiplayerService.joinRoom).not.toHaveBeenCalled();
      });

      it('should allow non-spectators to join as players', async () => {
        mockClient.data.isSpectator = false;
        const room = { id: 'room-1' };
        multiplayerService.joinRoom.mockReturnValue(room);
        multiplayerService.getSpectatorCount.mockReturnValue(1);

        await gateway.handleJoinRoom(mockClient, {
          roomId: 'room-1',
          userId: 'user-1',
          username: 'testuser',
          skillLevel: 5,
        });

        expect(multiplayerService.joinRoom).toHaveBeenCalled();
      });
    });
  });

  describe('Broadcast Separation', () => {
    it('should broadcast puzzle state updates to both players and spectators', async () => {
      mockClient.data.isSpectator = false;
      const room = { id: 'room-1' };
      multiplayerService.updatePuzzleState.mockReturnValue(room);
      multiplayerService.getSpectatorCount.mockReturnValue(1);

      await gateway.handleUpdatePuzzleState(mockClient, {
        roomId: 'room-1',
        state: { some: 'data' },
      });

      expect(mockClient.to).toHaveBeenCalledWith('room-1');
      expect(gateway['server'].to).toHaveBeenCalledWith('room-1-spectators');
    });

    it('should broadcast solution verification to both players and spectators', async () => {
      mockClient.data.isSpectator = false;
      const room = {
        id: 'room-1',
        status: RoomStatus.PLAYING,
        players: [{ id: 'user-1', score: 0, solvedPuzzles: [] }],
      };
      const puzzle = { id: 'puzzle-1', content: { type: 'test' } };

      multiplayerService.getRoom.mockReturnValue(room);
      jest.spyOn(gateway['puzzlesService'], 'findOne').mockResolvedValue(puzzle);
      jest.spyOn(gateway['validationService'], 'validateSolution').mockResolvedValue({
        isValid: true,
        score: 100,
      });
      multiplayerService.getSpectatorCount.mockReturnValue(1);

      await gateway.handleSubmitSolution(mockClient, {
        roomId: 'room-1',
        userId: 'user-1',
        puzzleId: 'puzzle-1',
        solution: { answer: 'test' },
      });

      expect(mockClient.to).toHaveBeenCalledWith('room-1');
      expect(gateway['server'].to).toHaveBeenCalledWith('room-1-spectators');
    });
  });
});
