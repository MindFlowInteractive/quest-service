import { Test, TestingModule } from '@nestjs/testing';
import { PuzzleEngineService } from '../services/puzzle-engine.service';
import { PuzzleType, DifficultyLevel, PuzzleMove } from '../types/puzzle.types';

// Mock all the dependencies to avoid complex service compilation issues
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockService = {
  generatePuzzle: jest.fn(),
  validateMove: jest.fn(),
  calculateScore: jest.fn(),
  checkAchievements: jest.fn(),
  saveState: jest.fn(),
  loadState: jest.fn(),
  getOrCreateSession: jest.fn(),
  registerPuzzleType: jest.fn(),
  onModuleInit: jest.fn(),
};

describe('Puzzle Engine Integration', () => {
  let module: TestingModule;
  let puzzleEngineService: PuzzleEngineService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        PuzzleEngineService,
        { provide: 'PuzzleStateRepository', useValue: mockRepository },
        { provide: 'StateManagementService', useValue: mockService },
        { provide: 'ValidationService', useValue: mockService },
        { provide: 'CauseEffectEngineService', useValue: mockService },
        { provide: 'AnalyticsService', useValue: mockService },
        { provide: 'GAME_ENGINE_CONFIG', useValue: { analytics: { sessionTimeout: 1000 } } },
      ],
    }).compile();

    puzzleEngineService = module.get<PuzzleEngineService>(PuzzleEngineService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Basic Service Methods', () => {
    it('should be defined', () => {
      expect(puzzleEngineService).toBeDefined();
    });

    it('should have createPuzzle method', () => {
      expect(puzzleEngineService.createPuzzle).toBeDefined();
      expect(typeof puzzleEngineService.createPuzzle).toBe('function');
    });

    it('should have makeMove method', () => {
      expect(puzzleEngineService.makeMove).toBeDefined();
      expect(typeof puzzleEngineService.makeMove).toBe('function');
    });

    it('should have getPuzzleState method', () => {
      expect(puzzleEngineService.getPuzzleState).toBeDefined();
      expect(typeof puzzleEngineService.getPuzzleState).toBe('function');
    });

    it('should have loadPuzzle method', () => {
      expect(puzzleEngineService.loadPuzzle).toBeDefined();
      expect(typeof puzzleEngineService.loadPuzzle).toBe('function');
    });

    it('should have resetPuzzle method', () => {
      expect(puzzleEngineService.resetPuzzle).toBeDefined();
      expect(typeof puzzleEngineService.resetPuzzle).toBe('function');
    });
  });
});
