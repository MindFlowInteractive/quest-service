import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from '../entities/badge.entity';
import { Achievement } from '../entities/achievement.entity';

@Injectable()
export class BadgeService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
  ) {}

  async awardBadge(userId: string, achievement: Achievement): Promise<Badge> {
    const existing = await this.badgeRepo.findOne({ where: { userId, achievement: { id: achievement.id } } });
    if (existing) {
      return existing;
    }

    const badge = this.badgeRepo.create({
      userId,
      achievement,
      name: achievement.name,
      rarity: achievement.rarity,
    });

    return this.badgeRepo.save(badge);
  }

  async getUserBadges(userId: string): Promise<Badge[]> {
    return this.badgeRepo.find({ where: { userId } });
  }
}
