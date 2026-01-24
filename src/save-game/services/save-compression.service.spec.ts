import { Test, TestingModule } from '@nestjs/testing';
import { SaveCompressionService } from './save-compression.service';
import { SaveGameData } from '../interfaces/save-game.interfaces';

describe('SaveCompressionService', () => {
  let service: SaveCompressionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaveCompressionService],
    }).compile();

    service = module.get<SaveCompressionService>(SaveCompressionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('compress', () => {
    it('should compress save data successfully', async () => {
      const testData: SaveGameData = {
        version: 1,
        gameState: { level: 1, score: 1000 },
        playerState: {
          position: { x: 100, y: 200 },
          health: 100,
          inventory: ['sword', 'shield', 'potion'],
        },
        progressState: {
          completedLevels: ['level1', 'level2', 'level3'],
          unlockedAchievements: ['first_blood', 'explorer'],
        },
      };

      const result = await service.compress(testData);

      expect(result.compressedData).toBeDefined();
      expect(result.compressedData).toBeInstanceOf(Buffer);
      expect(result.compressionInfo).toBeDefined();
      expect(result.compressionInfo.originalSize).toBeGreaterThan(0);
    });

    it('should use gzip compression for large data', async () => {
      // Create data large enough to benefit from compression
      const largeData: SaveGameData = {
        version: 1,
        gameState: {
          items: Array(100).fill({ name: 'test item', value: 100 }),
        },
        playerState: {
          inventory: Array(50).fill('item'),
          stats: Object.fromEntries(
            Array(20).fill(0).map((_, i) => [`stat${i}`, i * 10]),
          ),
        },
        progressState: {
          completedLevels: Array(100).fill('level').map((l, i) => `${l}${i}`),
        },
      };

      const result = await service.compress(largeData);

      expect(result.compressionInfo.algorithm).toBe('gzip');
      expect(result.compressionInfo.compressedSize).toBeLessThan(
        result.compressionInfo.originalSize,
      );
    });

    it('should skip compression for small data', async () => {
      const smallData: SaveGameData = {
        version: 1,
        gameState: {},
        playerState: {},
        progressState: {},
      };

      const result = await service.compress(smallData);

      // For very small data, compression might not be beneficial
      expect(result.compressionInfo).toBeDefined();
      expect(['gzip', 'none']).toContain(result.compressionInfo.algorithm);
    });

    it('should track original and compressed sizes', async () => {
      const testData: SaveGameData = {
        version: 1,
        gameState: { data: 'a'.repeat(1000) },
        playerState: {},
        progressState: {},
      };

      const result = await service.compress(testData);

      expect(result.compressionInfo.originalSize).toBeGreaterThan(0);
      expect(result.compressionInfo.compressedSize).toBeGreaterThan(0);
    });
  });

  describe('decompress', () => {
    it('should decompress gzip data correctly', async () => {
      const originalData: SaveGameData = {
        version: 1,
        gameState: { level: 5, score: 5000 },
        playerState: {
          position: { x: 50, y: 75 },
          health: 80,
          inventory: ['magic_wand'],
        },
        progressState: {
          completedLevels: ['tutorial', 'level1'],
        },
      };

      // Compress first
      const { compressedData, compressionInfo } = await service.compress(originalData);

      // Then decompress
      const decompressed = await service.decompress(compressedData, compressionInfo);

      expect(decompressed).toEqual(originalData);
    });

    it('should handle uncompressed data', async () => {
      const testData: SaveGameData = {
        version: 1,
        gameState: {},
        playerState: {},
        progressState: {},
      };

      const jsonString = JSON.stringify(testData);
      const buffer = Buffer.from(jsonString, 'utf8');
      const compressionInfo = {
        algorithm: 'none' as const,
        originalSize: buffer.length,
        compressedSize: buffer.length,
      };

      const result = await service.decompress(buffer, compressionInfo);

      expect(result).toEqual(testData);
    });

    it('should throw on invalid compression algorithm', async () => {
      const buffer = Buffer.from('test');
      const invalidInfo = {
        algorithm: 'invalid' as any,
        originalSize: 4,
        compressedSize: 4,
      };

      await expect(service.decompress(buffer, invalidInfo)).rejects.toThrow(
        'Unsupported compression algorithm',
      );
    });

    it('should throw on corrupted data', async () => {
      const corruptedBuffer = Buffer.from('not valid gzip data');
      const compressionInfo = {
        algorithm: 'gzip' as const,
        originalSize: 100,
        compressedSize: 20,
      };

      await expect(
        service.decompress(corruptedBuffer, compressionInfo),
      ).rejects.toThrow();
    });
  });

  describe('compress and decompress round-trip', () => {
    it('should preserve data through compression round-trip', async () => {
      const testCases: SaveGameData[] = [
        {
          version: 1,
          gameState: {},
          playerState: {},
          progressState: {},
        },
        {
          version: 1,
          gameState: { nested: { deep: { value: true } } },
          playerState: { health: 0 },
          progressState: { completedLevels: [] },
        },
        {
          version: 1,
          gameState: {
            unicode: '日本語テスト',
            emoji: '🎮🎯🏆',
          },
          playerState: {},
          progressState: {},
        },
      ];

      for (const original of testCases) {
        const { compressedData, compressionInfo } = await service.compress(original);
        const restored = await service.decompress(compressedData, compressionInfo);

        expect(restored).toEqual(original);
      }
    });
  });

  describe('estimateCompressedSize', () => {
    it('should return a reasonable estimate', () => {
      const testData: SaveGameData = {
        version: 1,
        gameState: { data: 'a'.repeat(1000) },
        playerState: {},
        progressState: {},
      };

      const estimate = service.estimateCompressedSize(testData);

      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThan(JSON.stringify(testData).length);
    });
  });
});
