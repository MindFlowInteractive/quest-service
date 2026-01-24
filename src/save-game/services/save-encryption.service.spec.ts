import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SaveEncryptionService } from './save-encryption.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Buffer: NodeBuffer } = require('buffer');

describe('SaveEncryptionService', () => {
  let service: SaveEncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveEncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined), // Use random key for tests
          },
        },
      ],
    }).compile();

    service = module.get<SaveEncryptionService>(SaveEncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt', () => {
    it('should encrypt data successfully', async () => {
      const testData = NodeBuffer.from('Hello, World!');

      const result = await service.encrypt(testData);

      expect(result.encryptedData).toBeDefined();
      expect(result.encryptedData).toBeInstanceOf(NodeBuffer);
      expect(result.encryptionInfo).toBeDefined();
      expect(result.encryptionInfo.algorithm).toBe('aes-256-gcm');
      expect(result.encryptionInfo.iv).toBeDefined();
      expect(result.encryptionInfo.tag).toBeDefined();
    });

    it('should produce different ciphertext for same input', async () => {
      const testData = NodeBuffer.from('Same data');

      const result1 = await service.encrypt(testData);
      const result2 = await service.encrypt(testData);

      // Different IVs should produce different ciphertext
      expect(result1.encryptedData).not.toEqual(result2.encryptedData);
      expect(result1.encryptionInfo.iv).not.toBe(result2.encryptionInfo.iv);
    });

    it('should handle empty data', async () => {
      const emptyData = NodeBuffer.alloc(0);

      const result = await service.encrypt(emptyData);

      expect(result.encryptedData).toBeDefined();
      expect(result.encryptionInfo).toBeDefined();
    });

    it('should handle large data', async () => {
      const largeData = NodeBuffer.alloc(1024 * 1024, 'a'); // 1MB

      const result = await service.encrypt(largeData);

      expect(result.encryptedData).toBeDefined();
      expect(result.encryptedData.length).toBeGreaterThan(0);
    });
  });

  describe('decrypt', () => {
    it('should decrypt data correctly', async () => {
      const originalData = NodeBuffer.from('Secret message');

      const { encryptedData, encryptionInfo } = await service.encrypt(originalData);
      const decrypted = await service.decrypt(encryptedData, encryptionInfo);

      expect(decrypted).toEqual(originalData);
    });

    it('should throw on tampered ciphertext', async () => {
      const originalData = NodeBuffer.from('Secret message');

      const { encryptedData, encryptionInfo } = await service.encrypt(originalData);

      // Tamper with the ciphertext
      encryptedData[0] ^= 0xff;

      await expect(
        service.decrypt(encryptedData, encryptionInfo),
      ).rejects.toThrow('integrity check failed');
    });

    it('should throw on wrong IV', async () => {
      const originalData = NodeBuffer.from('Secret message');

      const { encryptedData, encryptionInfo } = await service.encrypt(originalData);

      // Use wrong IV
      const wrongInfo = {
        ...encryptionInfo,
        iv: NodeBuffer.alloc(16, 0).toString('base64'),
      };

      await expect(service.decrypt(encryptedData, wrongInfo)).rejects.toThrow();
    });

    it('should throw on unsupported algorithm', async () => {
      const data = NodeBuffer.from('test');
      const invalidInfo = {
        algorithm: 'unsupported' as any,
        iv: 'test',
        tag: 'test',
      };

      await expect(service.decrypt(data, invalidInfo)).rejects.toThrow(
        'Unsupported encryption algorithm',
      );
    });
  });

  describe('encrypt and decrypt round-trip', () => {
    it('should preserve data through encryption round-trip', async () => {
      const testCases = [
        NodeBuffer.from('Simple text'),
        NodeBuffer.from('日本語テスト'),
        NodeBuffer.from(JSON.stringify({ key: 'value', nested: { data: true } })),
        NodeBuffer.alloc(100, 0), // Zeros
        NodeBuffer.from([0x00, 0xff, 0x7f, 0x80]), // Binary data
      ];

      for (const original of testCases) {
        const { encryptedData, encryptionInfo } = await service.encrypt(original);
        const decrypted = await service.decrypt(encryptedData, encryptionInfo);

        expect(decrypted).toEqual(original);
      }
    });
  });

  describe('generateChecksum', () => {
    it('should generate consistent checksum for same data', () => {
      const data = NodeBuffer.from('Test data');

      const checksum1 = service.generateChecksum(data);
      const checksum2 = service.generateChecksum(data);

      expect(checksum1).toBe(checksum2);
    });

    it('should generate different checksum for different data', () => {
      const data1 = NodeBuffer.from('Data 1');
      const data2 = NodeBuffer.from('Data 2');

      const checksum1 = service.generateChecksum(data1);
      const checksum2 = service.generateChecksum(data2);

      expect(checksum1).not.toBe(checksum2);
    });

    it('should generate 64-character hex string (SHA-256)', () => {
      const data = NodeBuffer.from('Test');
      const checksum = service.generateChecksum(data);

      expect(checksum).toHaveLength(64);
      expect(checksum).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('verifyChecksum', () => {
    it('should return true for matching checksum', () => {
      const data = NodeBuffer.from('Test data');
      const checksum = service.generateChecksum(data);

      expect(service.verifyChecksum(data, checksum)).toBe(true);
    });

    it('should return false for non-matching checksum', () => {
      const data = NodeBuffer.from('Test data');
      const wrongChecksum = service.generateChecksum(NodeBuffer.from('Different data'));

      expect(service.verifyChecksum(data, wrongChecksum)).toBe(false);
    });

    it('should detect single-bit changes', () => {
      const data = NodeBuffer.from('Test data');
      const checksum = service.generateChecksum(data);

      // Change one bit
      const tamperedData = NodeBuffer.from(data);
      tamperedData[0] ^= 0x01;

      expect(service.verifyChecksum(tamperedData, checksum)).toBe(false);
    });
  });

  describe('generateDeviceKey', () => {
    it('should generate consistent keys for same user and device', () => {
      const key1 = service.generateDeviceKey('user1', 'device1');
      const key2 = service.generateDeviceKey('user1', 'device1');

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different users', () => {
      const key1 = service.generateDeviceKey('user1', 'device1');
      const key2 = service.generateDeviceKey('user2', 'device1');

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different devices', () => {
      const key1 = service.generateDeviceKey('user1', 'device1');
      const key2 = service.generateDeviceKey('user1', 'device2');

      expect(key1).not.toBe(key2);
    });

    it('should generate 64-character hex string', () => {
      const key = service.generateDeviceKey('user', 'device');

      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[a-f0-9]+$/);
    });
  });
});
