import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

@Injectable()
export class EncryptionService {
  readonly currentKeyVersion: number;
  private readonly keys = new Map<number, Buffer>();

  constructor(config: ConfigService) {
    this.currentKeyVersion = Number(config.get('ENCRYPTION_KEY_VERSION', '1'));
    const current = config.get<string>('ENCRYPTION_KEY');
    const nodeEnv = config.get<string>('NODE_ENV', 'development');
    if (!current && nodeEnv === 'production') {
      throw new InternalServerErrorException('ENCRYPTION_KEY is required in production');
    }
    this.keys.set(this.currentKeyVersion, this.normalizeKey(current || 'development-only-insecure-key'));

    for (let version = 1; version < this.currentKeyVersion; version += 1) {
      const oldKey = config.get<string>(`ENCRYPTION_KEY_V${version}`);
      if (oldKey) this.keys.set(version, this.normalizeKey(oldKey));
    }
  }

  encrypt(value: string, keyVersion = this.currentKeyVersion): string {
    const key = this.getKey(keyVersion);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
  }

  decrypt(payload: string, keyVersion: number): string {
    const [ivValue, tagValue, encryptedValue] = payload.split('.');
    if (!ivValue || !tagValue || !encryptedValue) throw new Error('Invalid encrypted secret format');
    const decipher = createDecipheriv('aes-256-gcm', this.getKey(keyVersion), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
  }

  private getKey(version: number): Buffer {
    const key = this.keys.get(version);
    if (!key) throw new InternalServerErrorException(`Encryption key version ${version} is unavailable`);
    return key;
  }

  private normalizeKey(value: string): Buffer {
    const decoded = Buffer.from(value, 'base64');
    return decoded.length === 32 ? decoded : createHash('sha256').update(value).digest();
  }
}
