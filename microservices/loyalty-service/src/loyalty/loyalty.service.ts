import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyPoints } from './loyalty.entity';

const TIER_THRESHOLDS = { silver: 500, gold: 2000, platinum: 5000 };

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyPoints)
    private readonly repo: Repository<LoyaltyPoints>,
  ) {}

  async getPoints(userId: string): Promise<LoyaltyPoints | null> {
    return this.repo.findOne({ where: { userId } });
  }

  async addPoints(userId: string, amount: number): Promise<LoyaltyPoints> {
    let record = await this.repo.findOne({ where: { userId } });
    if (!record) record = this.repo.create({ userId, points: 0 });
    record.points += amount;
    record.tier = this.calculateTier(record.points);
    return this.repo.save(record);
  }

  private calculateTier(points: number): string {
    if (points >= TIER_THRESHOLDS.platinum) return 'platinum';
    if (points >= TIER_THRESHOLDS.gold) return 'gold';
    if (points >= TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }
}