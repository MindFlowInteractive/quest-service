import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReplayService } from './replay.service';
import { Replay, PrivacyLevel } from '../entities/replay.entity';
import { Action, ActionType } from '../entities/action.entity';
import { Recording, RecordingStatus, CompressionType } from '../entities/recording.entity';
import { CompressionService } from '../compression/compression.service';
import { StorageService } from '../storage/storage.service';

describe('ReplayService', () => {
  let service: ReplayService;
  let mockReplayRepository: any;
  let mockActionRepository: any;
  let mockRecordingRepository: any;
  let mockCompressionService: any;
  let mockStorageService: any;

  beforeEach(async () => {
    // Create mock repositories
    mockReplayRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
      remove: jest.fn(),
    };

    mockActionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockRecordingRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    mockCompressionService = {
      compress: jest.fn(),
      decompress: jest.fn(),
      calculateCompressionRatio: jest.fn(),
      getRecommendedCompressionType: jest.fn(),
    };

    mockStorageService = {
      storeReplay: jest.fn(),
      retrieveReplay: jest.fn(),
      deleteReplay: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplayService,
        {
          provide: getRepositoryToken(Replay),
          useValue: mockReplayRepository,
        },
        {
          provide: getRepositoryToken(Action),
          useValue: mockActionRepository,
        },
        {
          provide: getRepositoryToken(Recording),
          useValue: mockRecordingRepository,
        },
        {
          provide: CompressionService,
          useValue: mockCompressionService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<ReplayService>(ReplayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReplay', () => {
    it('should create a new replay', async () => {
      const input = {
        puzzleId: 1,
        playerId: 1,
        title: 'Test Replay',
        description: 'A test replay',
        initialState: { puzzle: 'state' },
      };

      const replay = {
        id: 'uuid-1',
        ...input,
        privacyLevel: PrivacyLevel.PRIVATE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReplayRepository.create.mockReturnValue(replay);
      mockReplayRepository.save.mockResolvedValue(replay);

      const result = await service.createReplay(input);

      expect(result).toEqual(replay);
      expect(mockReplayRepository.create).toHaveBeenCalledWith(expect.objectContaining(input));
      expect(mockReplayRepository.save).toHaveBeenCalled();
    });
  });

  describe('recordAction', () => {
    it('should record an action', async () => {
      const replayId = 'uuid-1';
      const replay = {
        id: replayId,
        createdAt: new Date(),
      };

      const input = {
        replayId,
        type: ActionType.MOVE,
        payload: { x: 10, y: 20 },
        timestamp: Date.now(),
      };

      mockReplayRepository.findOne.mockResolvedValue(replay);
      mockActionRepository.findOne.mockResolvedValue(null);

      const action = {
        id: 'action-1',
        ...input,
        sequence: 1,
        relativeTime: 0,
      };

      mockActionRepository.create.mockReturnValue(action);
      mockActionRepository.save.mockResolvedValue(action);

      const result = await service.recordAction(input);

      expect(result).toEqual(action);
      expect(mockActionRepository.create).toHaveBeenCalled();
      expect(mockActionRepository.save).toHaveBeenCalled();
    });
  });

  describe('updatePrivacy', () => {
    it('should update replay privacy level', async () => {
      const replayId = 'uuid-1';
      const playerId = 1;
      const replay = {
        id: replayId,
        playerId,
        privacyLevel: PrivacyLevel.PRIVATE,
      };

      mockReplayRepository.findOne.mockResolvedValue(replay);
      mockReplayRepository.save.mockResolvedValue({
        ...replay,
        privacyLevel: PrivacyLevel.PUBLIC,
      });

      const result = await service.updatePrivacy(
        replayId,
        playerId,
        PrivacyLevel.PUBLIC,
      );

      expect(result.privacyLevel).toBe(PrivacyLevel.PUBLIC);
    });

    it('should throw error if user is not replay owner', async () => {
      const replayId = 'uuid-1';
      const replay = {
        id: replayId,
        playerId: 1,
      };

      mockReplayRepository.findOne.mockResolvedValue(replay);

      await expect(
        service.updatePrivacy(replayId, 2, PrivacyLevel.PUBLIC),
      ).rejects.toThrow('Cannot modify other players replays');
    });
  });

  describe('getReplayByToken', () => {
    it('should retrieve replay by share token', async () => {
      const token = 'share-token-1';
      const replay = {
        id: 'uuid-1',
        shareToken: token,
        privacyLevel: PrivacyLevel.UNLISTED,
        isDeleted: false,
      };

      mockReplayRepository.findOne.mockResolvedValue(replay);

      const result = await service.getReplayByToken(token);

      expect(result).toEqual(replay);
      expect(mockReplayRepository.findOne).toHaveBeenCalledWith({
        where: {
          shareToken: token,
          isDeleted: false,
          privacyLevel: PrivacyLevel.UNLISTED,
        },
      });
    });
  });
});
