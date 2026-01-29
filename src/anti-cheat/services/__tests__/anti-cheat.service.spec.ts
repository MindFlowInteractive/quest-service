import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, MoreThan } from 'typeorm';
import { AntiCheatService } from '../anti-cheat.service';
import { DetectionService } from '../detection.service';
import { CheatViolation } from '../../entities/cheat-violation.entity';
import { PlayerBehaviorProfile } from '../../entities/player-behavior-profile.entity';
import { PuzzleMoveAudit } from '../../entities/puzzle-move-audit.entity';
import { ViolationType, Severity, ViolationStatus } from '../../constants';
import type { PuzzleMove } from '../../../game-engine/types/puzzle.types';

describe('AntiCheatService', () => {
  let service: AntiCheatService;
  let violationRepo: Repository<CheatViolation>;
  let profileRepo: Repository<PlayerBehaviorProfile>;
  let auditRepo: Repository<PuzzleMoveAudit>;
  let detectionService: DetectionService;

  const mockConfig = {
    enabled: true,
    thresholds: {
      maxMovesPerSecond: 10,
      initialTrustScore: 100,
      minTrustScore: 0,
    },
    shadowMode: {
      enabled: true,
      blockMoves: false,
    },
    logging: {
      logAllMoves: true,
      logSuspiciousMoves: true,
    }
  };

  const mockViolationRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockProfileRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAuditRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockDetectionService = {
    analyzeMoveSequence: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AntiCheatService,
        {
          provide: getRepositoryToken(CheatViolation),
          useValue: mockViolationRepo,
        },
        {
          provide: getRepositoryToken(PlayerBehaviorProfile),
          useValue: mockProfileRepo,
        },
        {
          provide: getRepositoryToken(PuzzleMoveAudit),
          useValue: mockAuditRepo,
        },
        {
          provide: DetectionService,
          useValue: mockDetectionService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'antiCheat') return mockConfig;
              if (key === 'antiCheat.thresholds') return mockConfig.thresholds;
              if (key === 'antiCheat.shadowMode') return mockConfig.shadowMode;
              if (key === 'antiCheat.logging') return mockConfig.logging;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AntiCheatService>(AntiCheatService);
    violationRepo = module.get<Repository<CheatViolation>>(getRepositoryToken(CheatViolation));
    profileRepo = module.get<Repository<PlayerBehaviorProfile>>(getRepositoryToken(PlayerBehaviorProfile));
    auditRepo = module.get<Repository<PuzzleMoveAudit>>(getRepositoryToken(PuzzleMoveAudit));
    detectionService = module.get<DetectionService>(DetectionService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('auditMove', () => {
    it('should create audit record', async () => {
      const move: PuzzleMove = {
        id: 'move-1',
        timestamp: new Date(),
        playerId: 'player-1',
        puzzleId: 'puzzle-1',
        moveType: 'test',
        moveData: {},
        isValid: true
      };

      const validationResult = { isValid: true, isComplete: false, score: 10, errors: [], completionPercentage: 50 };

      mockAuditRepo.create.mockReturnValue({ id: 'audit-1' });
      mockAuditRepo.save.mockResolvedValue({ id: 'audit-1' });

      await service.auditMove('player-1', 'puzzle-1', 'session-1', move, 1, 500, validationResult);

      expect(mockAuditRepo.create).toHaveBeenCalledWith({
        playerId: 'player-1',
        puzzleId: 'puzzle-1',
        sessionId: 'session-1',
        moveData: move,
        moveNumber: 1,
        timeSincePreviousMove: 500,
        wasValid: true,
        validationResult,
        flaggedAsSuspicious: false,
        suspicionReasons: null
      });
      expect(mockAuditRepo.save).toHaveBeenCalled();
    });

    it('should handle audit errors gracefully', async () => {
      const move: PuzzleMove = {
        id: 'move-1',
        timestamp: new Date(),
        playerId: 'player-1',
        puzzleId: 'puzzle-1',
        moveType: 'test',
        moveData: {},
        isValid: true
      };

      mockAuditRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(
        service.auditMove('player-1', 'puzzle-1', 'session-1', move, 1, 500, { isValid: true, isComplete: false, score: 0, errors: [], completionPercentage: 0 })
      ).resolves.not.toThrow();
    });
  });

  describe('analyzeMoveSequence', () => {
    it('should detect and record violations', async () => {
      const moves: PuzzleMove[] = [
        { id: 'move-1', timestamp: new Date(), playerId: 'player-1', puzzleId: 'puzzle-1', moveType: 'test', moveData: {}, isValid: true }
      ];

      mockDetectionService.analyzeMoveSequence.mockReturnValue({
        isAnomaly: true,
        violations: [{
          type: ViolationType.IMPOSSIBLY_FAST_COMPLETION,
          severity: Severity.HIGH,
          confidenceScore: 85,
          evidence: {
            detectionMethod: 'speed_analysis',
            metrics: {},
            anomalies: []
          }
        }],
        metrics: {}
      });

      mockViolationRepo.create.mockReturnValue({ id: 'violation-1' });
      mockViolationRepo.save.mockResolvedValue({ id: 'violation-1' });
      mockProfileRepo.findOne.mockResolvedValue({ id: 'profile-1', trustScore: 100, totalViolations: 0 });
      mockProfileRepo.save.mockResolvedValue({});

      await service.analyzeMoveSequence('player-1', 'puzzle-1', 'session-1', moves, {
        isFirstAttempt: true,
        allMovesValid: true
      });

      expect(mockDetectionService.analyzeMoveSequence).toHaveBeenCalled();
      expect(mockViolationRepo.create).toHaveBeenCalled();
      expect(mockViolationRepo.save).toHaveBeenCalled();
    });

    it('should not create violations when no anomalies detected', async () => {
      const moves: PuzzleMove[] = [
        { id: 'move-1', timestamp: new Date(), playerId: 'player-1', puzzleId: 'puzzle-1', moveType: 'test', moveData: {}, isValid: true }
      ];

      mockDetectionService.analyzeMoveSequence.mockReturnValue({
        isAnomaly: false,
        violations: [],
        metrics: {}
      });

      await service.analyzeMoveSequence('player-1', 'puzzle-1', 'session-1', moves, {
        isFirstAttempt: true,
        allMovesValid: true
      });

      expect(mockViolationRepo.create).not.toHaveBeenCalled();
      expect(mockViolationRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('recordViolation', () => {
    it('should create violation record in shadow mode', async () => {
      const violation = {
        type: ViolationType.ROBOTIC_TIMING,
        severity: Severity.MEDIUM,
        confidenceScore: 75,
        evidence: {
          detectionMethod: 'timing_analysis',
          metrics: {},
          anomalies: []
        }
      };

      mockViolationRepo.create.mockReturnValue({ id: 'violation-1' });
      mockViolationRepo.save.mockResolvedValue({ id: 'violation-1', ...violation });

      const result = await service.recordViolation('player-1', 'puzzle-1', 'session-1', violation);

      expect(result).toBeDefined();
      expect(mockViolationRepo.create).toHaveBeenCalledWith({
        playerId: 'player-1',
        puzzleId: 'puzzle-1',
        sessionId: 'session-1',
        violationType: violation.type,
        severity: violation.severity,
        confidenceScore: violation.confidenceScore,
        evidence: violation.evidence,
        status: ViolationStatus.PENDING,
        autoDetected: true,
        actionTaken: false
      });
    });
  });

  describe('checkRateLimit', () => {
    it('should pass when under rate limit', async () => {
      mockAuditRepo.count.mockResolvedValue(5);

      const result = await service.checkRateLimit('player-1', 'puzzle-1');

      expect(result.passed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should fail when rate limit exceeded', async () => {
      mockAuditRepo.count.mockResolvedValue(15); // Over limit of 10

      const result = await service.checkRateLimit('player-1', 'puzzle-1');

      expect(result.passed).toBe(false);
      expect(result.reason).toContain('Rate limit exceeded');
    });
  });

  describe('validateMoveTimestamp', () => {
    it('should pass for valid timestamp', () => {
      const move: PuzzleMove = {
        id: 'move-1',
        timestamp: new Date(),
        playerId: 'player-1',
        puzzleId: 'puzzle-1',
        moveType: 'test',
        moveData: {},
        isValid: true
      };

      const result = service.validateMoveTimestamp(move);

      expect(result.passed).toBe(true);
    });

    it('should fail for future timestamp', () => {
      const futureDate = new Date(Date.now() + 10000);
      const move: PuzzleMove = {
        id: 'move-1',
        timestamp: futureDate,
        playerId: 'player-1',
        puzzleId: 'puzzle-1',
        moveType: 'test',
        moveData: {},
        isValid: true
      };

      const result = service.validateMoveTimestamp(move);

      expect(result.passed).toBe(false);
      expect(result.reason).toContain('future');
    });

    it('should fail for excessive drift', () => {
      const oldDate = new Date(Date.now() - 10000);
      const move: PuzzleMove = {
        id: 'move-1',
        timestamp: oldDate,
        playerId: 'player-1',
        puzzleId: 'puzzle-1',
        moveType: 'test',
        moveData: {},
        isValid: true
      };

      const result = service.validateMoveTimestamp(move);

      expect(result.passed).toBe(false);
      expect(result.reason).toContain('drift');
    });
  });

  describe('getOrCreateProfile', () => {
    it('should return existing profile', async () => {
      const existingProfile = { id: 'profile-1', playerId: 'player-1', trustScore: 95 };
      mockProfileRepo.findOne.mockResolvedValue(existingProfile);

      const result = await service.getOrCreateProfile('player-1');

      expect(result).toEqual(existingProfile);
      expect(mockProfileRepo.create).not.toHaveBeenCalled();
    });

    it('should create new profile when none exists', async () => {
      mockProfileRepo.findOne.mockResolvedValue(null);
      const newProfile = { id: 'profile-1', playerId: 'player-1', trustScore: 100 };
      mockProfileRepo.create.mockReturnValue(newProfile);
      mockProfileRepo.save.mockResolvedValue(newProfile);

      const result = await service.getOrCreateProfile('player-1');

      expect(mockProfileRepo.create).toHaveBeenCalled();
      expect(mockProfileRepo.save).toHaveBeenCalled();
      expect(result.trustScore).toBe(100);
    });
  });

  describe('updateBehaviorProfile', () => {
    it('should decay trust score on violation', async () => {
      const profile = {
        id: 'profile-1',
        playerId: 'player-1',
        trustScore: 100,
        totalViolations: 0,
        riskFactors: { flaggedBehaviors: [] }
      };

      mockProfileRepo.findOne.mockResolvedValue(profile);
      mockProfileRepo.save.mockResolvedValue({ ...profile, trustScore: 95, totalViolations: 1 });

      await service.updateBehaviorProfile('player-1', {
        violationDetected: true,
        violationTypes: [ViolationType.IMPOSSIBLY_FAST_COMPLETION]
      });

      expect(mockProfileRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          totalViolations: 1,
          trustScore: 95
        })
      );
    });
  });
});
