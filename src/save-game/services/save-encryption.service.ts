import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EncryptionInfo } from '../interfaces/save-game.interfaces';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Buffer: NodeBuffer } = require('buffer');

@Injectable()
export class SaveEncryptionService {
  private readonly logger = new Logger(SaveEncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits for GCM
  private readonly tagLength = 16; // 128 bits for auth tag
  private encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    this.initializeKey();
  }

  private initializeKey(): void {
    const keyString = this.configService.get<string>('SAVE_ENCRYPTION_KEY');

    if (keyString) {
      // Use provided key (should be 64 hex characters for 256 bits)
      this.encryptionKey = NodeBuffer.from(keyString, 'hex');
      if (this.encryptionKey.length !== this.keyLength) {
        throw new Error(
          `Invalid encryption key length. Expected ${this.keyLength * 2} hex characters.`,
        );
      }
    } else {
      // Generate a random key for development (log warning)
      this.logger.warn(
        'SAVE_ENCRYPTION_KEY not configured. Using random key. Save data will not persist across restarts.',
      );
      this.encryptionKey = crypto.randomBytes(this.keyLength);
    }
  }

  async encrypt(data: Buffer): Promise<{
    encryptedData: Buffer;
    encryptionInfo: EncryptionInfo;
  }> {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv, {
      authTagLength: this.tagLength,
    });

    const encrypted = NodeBuffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedData: encrypted,
      encryptionInfo: {
        algorithm: 'aes-256-gcm',
        iv: (iv as unknown as { toString(encoding: string): string }).toString('base64'),
        tag: (authTag as unknown as { toString(encoding: string): string }).toString('base64'),
      },
    };
  }

  async decrypt(encryptedData: Buffer, encryptionInfo: EncryptionInfo): Promise<Buffer> {
    if (encryptionInfo.algorithm !== 'aes-256-gcm') {
      throw new Error(`Unsupported encryption algorithm: ${encryptionInfo.algorithm}`);
    }

    const iv = NodeBuffer.from(encryptionInfo.iv, 'base64');
    const authTag = NodeBuffer.from(encryptionInfo.tag, 'base64');

    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv, {
      authTagLength: this.tagLength,
    });
    decipher.setAuthTag(authTag);

    try {
      const decrypted = NodeBuffer.concat([decipher.update(encryptedData), decipher.final()]);
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed - data may be corrupted or tampered with');
      throw new Error('Failed to decrypt save data: integrity check failed');
    }
  }

  generateChecksum(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  verifyChecksum(data: Buffer, expectedChecksum: string): boolean {
    const actualChecksum = this.generateChecksum(data);
    return crypto.timingSafeEqual(
      NodeBuffer.from(actualChecksum, 'hex'),
      NodeBuffer.from(expectedChecksum, 'hex'),
    );
  }

  generateDeviceKey(userId: string, deviceId: string): string {
    // Generate a device-specific key for additional security
    return crypto
      .createHmac('sha256', this.encryptionKey)
      .update(`${userId}:${deviceId}`)
      .digest('hex');
  }
}
