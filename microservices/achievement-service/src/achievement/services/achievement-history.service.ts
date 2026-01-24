import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from '../entities/badge.entity';

@Injectable()
export class AchievementHistoryService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
  ) {}

  async getUserHistory(userId: string): Promise<Badge[]> {
    return this.badgeRepo.find({
      where: { userId },
      order: { awardedAt: 'DESC' },
    });
  }
}
