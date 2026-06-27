import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  it('encrypts with authenticated encryption and decrypts the value', () => {
    const config = new ConfigService({ ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'), ENCRYPTION_KEY_VERSION: '2' });
    const service = new EncryptionService(config);
    const encrypted = service.encrypt('very-secret');
    expect(encrypted).not.toContain('very-secret');
    expect(service.decrypt(encrypted, 2)).toBe('very-secret');
  });

  it('rejects tampered ciphertext', () => {
    const config = new ConfigService({ ENCRYPTION_KEY: Buffer.alloc(32, 3).toString('base64') });
    const service = new EncryptionService(config);
    const encrypted = service.encrypt('secret');
    expect(() => service.decrypt(`${encrypted.slice(0, -1)}x`, 1)).toThrow();
  });
});
