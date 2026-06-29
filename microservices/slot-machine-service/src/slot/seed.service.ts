import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SeedService {
  private serverSeed: string;
  private serverSeedHash: string;

  constructor() {
    this.rotateSeed();
  }

  rotateSeed() {
    this.serverSeed = crypto.randomBytes(32).toString('hex');
    this.serverSeedHash = crypto.createHash('sha256').update(this.serverSeed).digest('hex');
    return this.serverSeedHash;
  }

  getHash() {
    return this.serverSeedHash;
  }

  reveal() {
    const seed = this.serverSeed;
    // rotate after reveal to keep forward secrecy
    this.rotateSeed();
    return seed;
  }

  computeHMAC(message: string) {
    return crypto.createHmac('sha256', this.serverSeed).update(message).digest('hex');
  }
}
