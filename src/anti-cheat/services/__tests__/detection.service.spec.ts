import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DetectionService } from '../detection.service';
import { ViolationType, Severity } from '../../constants';
import type { PuzzleMove } from '../../../game-engine/types/puzzle.types';

describe('DetectionService', () => {
  let service: DetectionService;
  let configService: ConfigService;

  const mockConfig = {
    thresholds: {
      impossiblyFastThreshold: 150,
      maxFastMoveRatio: 0.8,
      roboticConsistencyThreshold: 30,
      suspiciousAccuracyThreshold: 0.95,
      perfectAccuracyMinMoves: 15,
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DetectionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'antiCheat.thresholds') {
                return mockConfig.thresholds;
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DetectionService>(DetectionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectSpeedAnomalies', () => {
    it('should detect impossibly fast moves', () => {
      const moves = generateFastMoves(10, 100); // 10 moves, 100ms apart
      const result = service.detectSpeedAnomalies(moves);

      expect(result.isAnomaly).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe(ViolationType.IMPOSSIBLY_FAST_COMPLETION);
      expect(result.violations[0].severity).toBe(Severity.HIGH);
      expect(result.violations[0].confidenceScore).toBeGreaterThan(50);
    });

    it('should detect robotic timing patterns', () => {
      const moves = generateConsistentMoves(15, 200, 5); // 15 moves, 200ms ±5ms
      const result = service.detectSpeedAnomalies(moves);

      expect(result.isAnomaly).toBe(true);
      const roboticViolation = result.violations.find(
        v => v.type === ViolationType.ROBOTIC_TIMING
      );
      expect(roboticViolation).toBeDefined();
      expect(roboticViolation?.severity).toBe(Severity.MEDIUM);
    });

    it('should allow natural human variation', () => {
      const moves = generateHumanMoves(20); // Realistic human timing
      const result = service.detectSpeedAnomalies(moves);

      expect(result.isAnomaly).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it('should not flag with insufficient data', () => {
      const moves = generateFastMoves(2, 100); // Only 2 moves
      const result = service.detectSpeedAnomalies(moves);

      expect(result.isAnomaly).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it('should calculate correct metrics', () => {
      const moves = generateFastMoves(10, 100);
      const result = service.detectSpeedAnomalies(moves);

      expect(result.metrics.totalMoves).toBe(10);
      expect(result.metrics.fastMoves).toBeGreaterThan(0);
      expect(result.metrics.fastMoveRatio).toBeDefined();
      expect(result.metrics.stdDev).toBeDefined();
    });
  });

  describe('detectPerfectAccuracy', () => {
    it('should detect perfect accuracy on first attempt', () => {
      const moves = generateMoves(20);
      const result = service.detectPerfectAccuracy(moves, true, true);

      expect(result.isAnomaly).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe(ViolationType.PERFECT_ACCURACY);
      expect(result.violations[0].severity).toBe(Severity.HIGH);
    });

    it('should not flag perfect accuracy on retry', () => {
      const moves = generateMoves(20);
      const result = service.detectPerfectAccuracy(moves, true, false);

      expect(result.isAnomaly).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it('should not flag with insufficient moves', () => {
      const moves = generateMoves(10); // Less than minimum
      const result = service.detectPerfectAccuracy(moves, true, true);

      expect(result.isAnomaly).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('detectOptimalPath', () => {
    it('should detect near-optimal solution on first attempt', () => {
      const moves = generateMoves(21); // 21 moves
      const optimalMoveCount = 20; // 95.2% efficiency
      const result = service.detectOptimalPath(moves, optimalMoveCount, true);

      expect(result.isAnomaly).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe(ViolationType.AUTOMATED_SOLVER);
      expect(result.violations[0].severity).toBe(Severity.HIGH);
    });

    it('should allow optimal path on retry', () => {
      const moves = generateMoves(21);
      const optimalMoveCount = 20;
      const result = service.detectOptimalPath(moves, optimalMoveCount, false);

      expect(result.isAnomaly).toBe(false);
      expect(result.violations).toHaveLength(0);
    });

    it('should allow non-optimal paths', () => {
      const moves = generateMoves(30);
      const optimalMoveCount = 20; // 66% efficiency
      const result = service.detectOptimalPath(moves, optimalMoveCount, true);

      expect(result.isAnomaly).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('detectLackOfExploration', () => {
    it('should detect lack of backtracking in long sequences', () => {
      const moves = generateMoves(25);
      const result = service.detectLackOfExploration(moves);

      expect(result.isAnomaly).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe(ViolationType.AUTOMATED_SOLVER);
      expect(result.violations[0].severity).toBe(Severity.MEDIUM);
    });

    it('should not flag short sequences', () => {
      const moves = generateMoves(15);
      const result = service.detectLackOfExploration(moves);

      expect(result.isAnomaly).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('analyzeMoveSequence', () => {
    it('should detect multiple anomalies', () => {
      const moves = generateFastMoves(20, 100); // Fast moves
      const context = {
        isFirstAttempt: true,
        optimalMoveCount: 19, // 95% efficiency
        allMovesValid: true
      };

      const result = service.analyzeMoveSequence(moves, context);

      expect(result.isAnomaly).toBe(true);
      expect(result.violations.length).toBeGreaterThan(1);

      const violationTypes = result.violations.map(v => v.type);
      expect(violationTypes).toContain(ViolationType.IMPOSSIBLY_FAST_COMPLETION);
      expect(violationTypes).toContain(ViolationType.PERFECT_ACCURACY);
    });

    it('should not flag legitimate gameplay', () => {
      const moves = generateHumanMoves(30);
      const context = {
        isFirstAttempt: false,
        optimalMoveCount: 20,
        allMovesValid: false // Made some mistakes
      };

      const result = service.analyzeMoveSequence(moves, context);

      expect(result.isAnomaly).toBe(false);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('calculateZScore', () => {
    it('should calculate correct z-score', () => {
      const zScore = service.calculateZScore(130, 180, 30);
      expect(zScore).toBeCloseTo(-1.67, 1);
    });

    it('should handle zero standard deviation', () => {
      const zScore = service.calculateZScore(100, 100, 0);
      expect(zScore).toBe(0);
    });
  });
});

// Helper functions to generate test data
function generateMoves(count: number): PuzzleMove[] {
  const moves: PuzzleMove[] = [];
  let timestamp = Date.now();

  for (let i = 0; i < count; i++) {
    moves.push({
      id: `move-${i}`,
      timestamp: new Date(timestamp),
      playerId: 'test-player',
      puzzleId: 'test-puzzle',
      moveType: 'test',
      moveData: { action: 'test' },
      isValid: true
    });
    timestamp += 500; // 500ms between moves
  }

  return moves;
}

function generateFastMoves(count: number, interval: number): PuzzleMove[] {
  const moves: PuzzleMove[] = [];
  let timestamp = Date.now();

  for (let i = 0; i < count; i++) {
    moves.push({
      id: `move-${i}`,
      timestamp: new Date(timestamp),
      playerId: 'test-player',
      puzzleId: 'test-puzzle',
      moveType: 'test',
      moveData: { action: 'test' },
      isValid: true
    });
    timestamp += interval;
  }

  return moves;
}

function generateConsistentMoves(count: number, interval: number, variance: number): PuzzleMove[] {
  const moves: PuzzleMove[] = [];
  let timestamp = Date.now();

  for (let i = 0; i < count; i++) {
    moves.push({
      id: `move-${i}`,
      timestamp: new Date(timestamp),
      playerId: 'test-player',
      puzzleId: 'test-puzzle',
      moveType: 'test',
      moveData: { action: 'test' },
      isValid: true
    });
    // Add small random variance
    const randomVariance = (Math.random() - 0.5) * 2 * variance;
    timestamp += interval + randomVariance;
  }

  return moves;
}

function generateHumanMoves(count: number): PuzzleMove[] {
  const moves: PuzzleMove[] = [];
  let timestamp = Date.now();

  for (let i = 0; i < count; i++) {
    moves.push({
      id: `move-${i}`,
      timestamp: new Date(timestamp),
      playerId: 'test-player',
      puzzleId: 'test-puzzle',
      moveType: 'test',
      moveData: { action: 'test' },
      isValid: true
    });
    // Human-like timing: 300-2000ms with occasional long pauses
    const baseInterval = 300 + Math.random() * 1700;
    const pause = Math.random() < 0.1 ? Math.random() * 5000 : 0; // 10% chance of pause
    timestamp += baseInterval + pause;
  }

  return moves;
}
