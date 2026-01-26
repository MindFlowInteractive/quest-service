import { Test, TestingModule } from '@nestjs/testing';
import { ScoringEngineService } from '../algorithms/scoring-engine.service';

describe('ScoringEngineService', () => {
  let service: ScoringEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScoringEngineService],
    }).compile();

    service = module.get<ScoringEngineService>(ScoringEngineService);
  });

  describe('combineScores', () => {
    it('should combine scores using default weights', () => {
      const scores = {
        collaborative: 0.8,
        contentBased: 0.6,
        popularity: 0.4,
      };
      
      const combinedScore = service.combineScores(scores);
      
      // Should be weighted average based on default weights
      expect(combinedScore).toBeGreaterThan(0);
      expect(combinedScore).toBeLessThanOrEqual(1);
    });

    it('should use custom weights when provided', () => {
      const scores = {
        collaborative: 0.8,
        contentBased: 0.6,
      };
      
      const customWeights = {
        collaborative: 0.7,
        contentBased: 0.3,
      };
      
      const combinedScore = service.combineScores(scores, customWeights);
      
      // Should be closer to collaborative score due to higher weight
      expect(combinedScore).toBeCloseTo(0.74, 2); // 0.8 * 0.7 + 0.6 * 0.3
    });

    it('should handle empty scores', () => {
      const combinedScore = service.combineScores({});
      expect(combinedScore).toBe(0);
    });
  });

  describe('calculateQualityScore', () => {
    it('should calculate quality score for high-quality puzzle', () => {
      const features = {
        category: 'logic',
        difficulty: 'medium',
        difficultyRating: 5,
        tags: ['challenging'],
        averageRating: 4.5,
        completionRate: 0.7,
        ageInDays: 10,
      };
      
      const qualityScore = service.calculateQualityScore(features);
      
      expect(qualityScore).toBeGreaterThan(0.7);
      expect(qualityScore).toBeLessThanOrEqual(1);
    });

    it('should penalize puzzles with extreme completion rates', () => {
      const easyPuzzle = {
        category: 'logic',
        difficulty: 'easy',
        difficultyRating: 2,
        tags: [],
        averageRating: 3.0,
        completionRate: 0.95, // Too easy
        ageInDays: 5,
      };
      
      const hardPuzzle = {
        ...easyPuzzle,
        completionRate: 0.05, // Too hard
      };
      
      const balancedPuzzle = {
        ...easyPuzzle,
        completionRate: 0.7, // Just right
      };
      
      const easyScore = service.calculateQualityScore(easyPuzzle);
      const hardScore = service.calculateQualityScore(hardPuzzle);
      const balancedScore = service.calculateQualityScore(balancedPuzzle);
      
      expect(balancedScore).toBeGreaterThan(easyScore);
      expect(balancedScore).toBeGreaterThan(hardScore);
    });
  });

  describe('applyDiversityPenalty', () => {
    it('should penalize repeated categories', () => {
      const scores = [
        { puzzleId: 'p1', category: 'logic', score: 0.9 },
        { puzzleId: 'p2', category: 'logic', score: 0.8 },
        { puzzleId: 'p3', category: 'math', score: 0.7 },
        { puzzleId: 'p4', category: 'logic', score: 0.6 },
      ];
      
      const diversified = service.applyDiversityPenalty(scores, 0.2);
      
      // First logic puzzle should keep original score
      expect(diversified[0].score).toBeCloseTo(0.9, 2);
      
      // Second logic puzzle should be penalized
      expect(diversified[1].score).toBeLessThan(0.8);
      
      // Math puzzle should keep original score (first in category)
      expect(diversified[2].score).toBeCloseTo(0.7, 2);
      
      // Third logic puzzle should be penalized more
      expect(diversified[3].score).toBeLessThan(diversified[1].score);
    });
  });

  describe('normalizeScores', () => {
    it('should normalize scores to 0-1 range', () => {
      const scores = [10, 20, 30, 40];
      
      const normalized = service.normalizeScores(scores);
      
      expect(normalized[0]).toBe(0); // Min value
      expect(normalized[3]).toBe(1); // Max value
      expect(normalized[1]).toBe(1/3); // (20-10)/(40-10)
      expect(normalized[2]).toBe(2/3); // (30-10)/(40-10)
    });

    it('should handle identical scores', () => {
      const scores = [5, 5, 5];
      
      const normalized = service.normalizeScores(scores);
      
      // All should be 0.5 when range is 0
      expect(normalized.every(score => score === 0.5)).toBe(true);
    });

    it('should handle empty array', () => {
      const normalized = service.normalizeScores([]);
      expect(normalized).toEqual([]);
    });
  });
});