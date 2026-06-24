import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private algorithm: string;
  private encryptionKey: string;
  private ivLength: number;

  constructor() {
    this.algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc';
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-insecure-key-change-in-production';
    this.ivLength = parseInt(process.env.ENCRYPTION_IV_LENGTH || '16', 10);

    // Ensure key is correct length for algorithm
    if (this.algorithm === 'aes-256-cbc') {
      if (this.encryptionKey.length < 32) {
        this.encryptionKey = crypto
          .createHash('sha256')
          .update(this.encryptionKey)
          .digest('hex')
          .slice(0, 32);
      }
    }
  }

  encrypt(text: string): { encryptedText: string; iv: string } {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.encryptionKey), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encryptedText: encrypted,
      iv: iv.toString('hex'),
    };
  }

  decrypt(encryptedText: string, iv: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.encryptionKey),
      Buffer.from(iv, 'hex'),
    );

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
