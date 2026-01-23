import { Test, TestingModule } from '@nestjs/testing';
import { AiAssistantService } from './ai-assistant.service';
import { StrategyExplainerService } from './strategy-explainer.service';
import { HintProgressionService } from './hint-progression.service';
import { LearningPathService } from './learning-path.service';
import { EffectivenessTrackerService } from './effectiveness-tracker.service';

describe('AiAssistantService', () => {
  let service: AiAssistantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAssistantService,
        StrategyExplainerService,
        HintProgressionService,
        LearningPathService,
        EffectivenessTrackerService,
      ],
    }).compile();

    service = module.get<AiAssistantService>(AiAssistantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzePuzzle', () => {
    it('should identify patterns in puzzle', async () => {
      const mockPuzzle = {
        grid: [[1, 2], [3, 4]],
        constraints: [],
      };

      const analysis = await service.analyzePuzzle(mockPuzzle, 'user123');
      
      expect(analysis).toHaveProperty('puzzleType');
      expect(analysis).toHaveProperty('difficulty');
      expect(analysis).toHaveProperty('suggestedStrategies');
    });
  });

  describe('getProgressiveHint', () => {
    it('should provide hints without revealing solution', async () => {
      const request = {
        puzzleId: 'puzzle1',
        userId: 'user123',
        currentState: {},
        previousAttempts: 2,
      };

      const hint = await service.getProgressiveHint(request);
      
      expect(hint.avoidsSolution).toBe(true);
      expect(hint.content).toBeDefined();
      expect(hint.level).toBeGreaterThan(0);
    });

    it('should escalate hint level with more attempts', async () => {
      const baseRequest = {
        puzzleId: 'puzzle1',
        userId: 'user123',
        currentState: {},
      };

      const hint1 = await service.getProgressiveHint({
        ...baseRequest,
        previousAttempts: 1,
      });

      const hint2 = await service.getProgressiveHint({
        ...baseRequest,
        previousAttempts: 6,
      });

      expect(hint2.level).toBeGreaterThan(hint1.level);
    });
  });
});

// Example integration test
describe('AI Assistant E2E', () => {
  it('should guide player through puzzle without solving it', async () => {
    // 1. Player starts puzzle
    // 2. Requests first hint (observational)
    // 3. Makes attempts
    // 4. Requests more hints (progressively more helpful)
    // 5. Solves puzzle
    // 6. System tracks effectiveness
    
    // This would be a full integration test
  });
});