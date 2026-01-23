import { Test, TestingModule } from '@nestjs/testing';
import { SaveVersioningService } from './save-versioning.service';
import { SaveGameData } from '../interfaces/save-game.interfaces';

describe('SaveVersioningService', () => {
  let service: SaveVersioningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaveVersioningService],
    }).compile();

    service = module.get<SaveVersioningService>(SaveVersioningService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('CURRENT_VERSION', () => {
    it('should have a current version defined', () => {
      expect(service.CURRENT_VERSION).toBeDefined();
      expect(typeof service.CURRENT_VERSION).toBe('number');
      expect(service.CURRENT_VERSION).toBeGreaterThan(0);
    });
  });

  describe('isCompatible', () => {
    it('should return true for current version', () => {
      expect(service.isCompatible(service.CURRENT_VERSION)).toBe(true);
    });

    it('should return true for versions that can be migrated', () => {
      // Since no migrations are defined yet, only current version is compatible
      expect(service.isCompatible(service.CURRENT_VERSION)).toBe(true);
    });
  });

  describe('validateDataStructure', () => {
    it('should validate correct save data', () => {
      const validData: SaveGameData = {
        version: 1,
        gameState: { level: 1 },
        playerState: { health: 100 },
        progressState: { completedLevels: [] },
      };

      const result = service.validateDataStructure(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null data', () => {
      const result = service.validateDataStructure(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Data must be an object');
    });

    it('should reject data without version', () => {
      const invalidData = {
        gameState: {},
        playerState: {},
        progressState: {},
      };

      const result = service.validateDataStructure(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid version field');
    });

    it('should reject data without gameState', () => {
      const invalidData = {
        version: 1,
        playerState: {},
        progressState: {},
      };

      const result = service.validateDataStructure(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid gameState field');
    });

    it('should reject data without playerState', () => {
      const invalidData = {
        version: 1,
        gameState: {},
        progressState: {},
      };

      const result = service.validateDataStructure(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid playerState field');
    });

    it('should reject data without progressState', () => {
      const invalidData = {
        version: 1,
        gameState: {},
        playerState: {},
      };

      const result = service.validateDataStructure(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid progressState field');
    });

    it('should collect multiple errors', () => {
      const invalidData = {
        gameState: {},
      };

      const result = service.validateDataStructure(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('createDefaultSaveData', () => {
    it('should create valid default save data', () => {
      const defaultData = service.createDefaultSaveData();

      expect(defaultData.version).toBe(service.CURRENT_VERSION);
      expect(defaultData.gameState).toBeDefined();
      expect(defaultData.playerState).toBeDefined();
      expect(defaultData.progressState).toBeDefined();
    });

    it('should have valid default player state', () => {
      const defaultData = service.createDefaultSaveData();

      expect(defaultData.playerState.position).toEqual({ x: 0, y: 0 });
      expect(defaultData.playerState.health).toBe(100);
      expect(defaultData.playerState.inventory).toEqual([]);
    });

    it('should pass validation', () => {
      const defaultData = service.createDefaultSaveData();
      const result = service.validateDataStructure(defaultData);

      expect(result.valid).toBe(true);
    });
  });

  describe('mergeWithDefaults', () => {
    it('should merge partial data with defaults', () => {
      const partialData = {
        gameState: { customField: 'value' },
        playerState: { health: 50 },
        progressState: {},
      };

      const merged = service.mergeWithDefaults(partialData);

      expect(merged.version).toBe(service.CURRENT_VERSION);
      expect(merged.gameState).toEqual({ customField: 'value' });
      expect(merged.playerState.health).toBe(50);
      expect(merged.playerState.position).toEqual({ x: 0, y: 0 });
    });

    it('should preserve nested custom fields', () => {
      const partialData = {
        gameState: {},
        playerState: {
          health: 75,
          customStat: 'max',
        },
        progressState: {
          completedLevels: ['level1', 'level2'],
        },
      };

      const merged = service.mergeWithDefaults(partialData);

      expect(merged.playerState.health).toBe(75);
      expect((merged.playerState as any).customStat).toBe('max');
      expect(merged.progressState.completedLevels).toEqual(['level1', 'level2']);
    });
  });

  describe('migrateToCurrentVersion', () => {
    it('should return data unchanged if already current version', () => {
      const data: SaveGameData = {
        version: service.CURRENT_VERSION,
        gameState: { test: true },
        playerState: { health: 100 },
        progressState: { completedLevels: [] },
      };

      const result = service.migrateToCurrentVersion(data);

      expect(result).toEqual(data);
    });

    it('should handle newer versions gracefully', () => {
      const futureData: SaveGameData = {
        version: service.CURRENT_VERSION + 1,
        gameState: {},
        playerState: {},
        progressState: {},
      };

      // Should not throw, just warn and return data
      expect(() => service.migrateToCurrentVersion(futureData)).not.toThrow();
    });
  });
});
