import { Test, TestingModule } from '@nestjs/testing';
import { SimilarityCalculatorService } from '../algorithms/similarity-calculator.service';

describe('SimilarityCalculatorService', () => {
  let service: SimilarityCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SimilarityCalculatorService],
    }).compile();

    service = module.get<SimilarityCalculatorService>(SimilarityCalculatorService);
  });

  describe('calculateJaccardSimilarity', () => {
    it('should return 1 for identical sets', () => {
      const setA = ['puzzle1', 'puzzle2', 'puzzle3'];
      const setB = ['puzzle1', 'puzzle2', 'puzzle3'];
      
      const similarity = service.calculateJaccardSimilarity(setA, setB);
      
      expect(similarity).toBe(1);
    });

    it('should return 0 for completely different sets', () => {
      const setA = ['puzzle1', 'puzzle2'];
      const setB = ['puzzle3', 'puzzle4'];
      
      const similarity = service.calculateJaccardSimilarity(setA, setB);
      
      expect(similarity).toBe(0);
    });

    it('should calculate correct similarity for overlapping sets', () => {
      const setA = ['puzzle1', 'puzzle2', 'puzzle3'];
      const setB = ['puzzle2', 'puzzle3', 'puzzle4'];
      
      const similarity = service.calculateJaccardSimilarity(setA, setB);
      
      // Intersection: [puzzle2, puzzle3] = 2 items
      // Union: [puzzle1, puzzle2, puzzle3, puzzle4] = 4 items
      // Similarity: 2/4 = 0.5
      expect(similarity).toBe(0.5);
    });

    it('should return 0 for empty sets', () => {
      const similarity = service.calculateJaccardSimilarity([], []);
      expect(similarity).toBe(0);
    });
  });

  describe('calculateCosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vectorA = [1, 2, 3];
      const vectorB = [1, 2, 3];
      
      const similarity = service.calculateCosineSimilarity(vectorA, vectorB);
      
      expect(similarity).toBeCloseTo(1, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vectorA = [1, 0];
      const vectorB = [0, 1];
      
      const similarity = service.calculateCosineSimilarity(vectorA, vectorB);
      
      expect(similarity).toBe(0);
    });

    it('should throw error for vectors of different lengths', () => {
      const vectorA = [1, 2];
      const vectorB = [1, 2, 3];
      
      expect(() => {
        service.calculateCosineSimilarity(vectorA, vectorB);
      }).toThrow('Vectors must have the same length');
    });
  });

  describe('getTopKSimilar', () => {
    it('should return top K items sorted by similarity', () => {
      const similarities = [
        { userId: 'user1', similarity: 0.8 },
        { userId: 'user2', similarity: 0.3 },
        { userId: 'user3', similarity: 0.9 },
        { userId: 'user4', similarity: 0.1 },
      ];
      
      const topK = service.getTopKSimilar(similarities, 2, 0.2);
      
      expect(topK).toHaveLength(2);
      expect(topK[0].userId).toBe('user3');
      expect(topK[1].userId).toBe('user1');
    });

    it('should filter out items below minimum similarity', () => {
      const similarities = [
        { userId: 'user1', similarity: 0.8 },
        { userId: 'user2', similarity: 0.05 },
      ];
      
      const topK = service.getTopKSimilar(similarities, 5, 0.1);
      
      expect(topK).toHaveLength(1);
      expect(topK[0].userId).toBe('user1');
    });
  });
});