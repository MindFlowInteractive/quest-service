import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { RewardDefinition } from './entities/reward.entity';
import { SpinDto } from './dto/spin.dto';
import * as crypto from 'crypto';
import { SeedService } from './seed.service';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SlotService {
  private symbols: RewardDefinition[] = [];
  private reels = 3;
  private rows = 3;
  private history: any[] = [];
  private lastSpinByUser: Map<string, number> = new Map();
  private cooldownMs = 3000; // 3 seconds cooldown
  private dataDir: string;

  constructor(private seedService: SeedService) {
    this.dataDir = path.join(process.cwd(), 'microservices', 'slot-machine-service', 'data');
    if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
    this.loadDefaults();
    this.loadHistory();
  }

  private loadDefaults() {
    this.symbols = [
      { symbol: 'CHERRY', weight: 30, payoutMultiplier: 2 },
      { symbol: 'LEMON', weight: 25, payoutMultiplier: 1.5 },
      { symbol: 'ORANGE', weight: 20, payoutMultiplier: 3 },
      { symbol: 'PLUM', weight: 12, payoutMultiplier: 5 },
      { symbol: 'BELL', weight: 8, payoutMultiplier: 10 },
      { symbol: '7', weight: 5, payoutMultiplier: 50 },
    ];
  }

  private loadHistory() {
    const file = path.join(this.dataDir, 'history.json');
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf8');
        this.history = JSON.parse(raw || '[]');
      }
    } catch (err) {
      console.warn('Failed to load history', err);
      this.history = [];
    }
  }

  private persistHistory() {
    const file = path.join(this.dataDir, 'history.json');
    fs.writeFileSync(file, JSON.stringify(this.history, null, 2));
  }

  getSeedHash() {
    return this.seedService.getHash();
  }

  revealSeed() {
    return this.seedService.reveal();
  }

  getHistoryForUser(userId: string) {
    return this.history.filter((h) => h.userId === userId).slice().reverse();
  }

  private weightedChoice(list: RewardDefinition[], rand: number) {
    const total = list.reduce((s, i) => s + i.weight, 0);
    let acc = 0;
    const r = rand * total;
    for (const item of list) {
      acc += item.weight;
      if (r <= acc) return item;
    }
    return list[list.length - 1];
  }

  private randomBytes(hex: string, offset: number, length: number) {
    // take part of hex string
    const slice = hex.slice(offset, offset + length);
    return parseInt(slice, 16);
  }

  spin(dto: SpinDto) {
    if (!dto.userId) throw new BadRequestException('userId required');
    const now = Date.now();
    const last = this.lastSpinByUser.get(dto.userId) || 0;
    if (now - last < this.cooldownMs) throw new ConflictException('Cooldown active');
    this.lastSpinByUser.set(dto.userId, now);

    const nonce = this.getNonceForUser(dto.userId);
    const message = `${dto.clientSeed}:${nonce}:${dto.betAmount}`;
    const proof = this.seedService.computeHMAC(message);

    // use proof hex to generate randomness
    const reels: string[][] = [];
    for (let r = 0; r < this.reels; r++) {
      const reel: string[] = [];
      for (let row = 0; row < this.rows; row++) {
        // derive pseudo-random float from proof slice
        const offset = (r * this.rows + row) * 8;
        const intVal = this.randomBytes(proof, offset, 8) || 0;
        const rand = (intVal % 1000000) / 1000000;
        const choice = this.weightedChoice(this.symbols, rand);
        reel.push(choice.symbol);
      }
      reels.push(reel);
    }

    // simple payline: middle row across all reels
    const payline = reels.map((r) => r[1]);
    const { multiplier } = this.evaluatePayline(payline);
    const payout = dto.betAmount * multiplier;

    const result = {
      userId: dto.userId,
      nonce,
      reels,
      payline,
      payout,
      multiplier,
      timestamp: now,
      serverSeedHash: this.seedService.getHash(),
      clientSeed: dto.clientSeed,
      proof,
      animation: this.makeAnimationData(reels),
    };

    this.history.push({ id: uuidv4(), userId: dto.userId, result });
    this.persistHistory();

    return result;
  }

  private evaluatePayline(payline: string[]) {
    // if all equal -> payout based on symbol multiplier
    const first = payline[0];
    const allSame = payline.every((s) => s === first);
    if (allSame) {
      const def = this.symbols.find((s) => s.symbol === first);
      return { multiplier: def ? def.payoutMultiplier : 1 };
    }
    // two of a kind -> small multiplier
    const counts = new Map<string, number>();
    for (const s of payline) counts.set(s, (counts.get(s) || 0) + 1);
    const max = Math.max(...Array.from(counts.values()));
    if (max === 2) return { multiplier: 0.5 };
    return { multiplier: 0 };
  }

  private makeAnimationData(reels: string[][]) {
    // for each reel: stop positions and duration
    return reels.map((r, idx) => ({
      reel: idx,
      stops: r,
      durationMs: 800 + idx * 150,
    }));
  }

  private getNonceForUser(userId: string) {
    // simple nonce based on count of previous spins
    const count = this.history.filter((h) => h.userId === userId).length;
    return count + 1;
  }
}
