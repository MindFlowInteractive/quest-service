import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from '../entities/achievement.entity';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
  ) {}

  findAll(): Promise<Achievement[]> {
    return this.achievementRepo.find();
  }

  findByCode(code: string): Promise<Achievement | null> {
    return this.achievementRepo.findOne({ where: { code } });
  }

  async upsert(achievement: Partial<Achievement>): Promise<Achievement> {
    const existing = achievement.code
      ? await this.achievementRepo.findOne({ where: { code: achievement.code } })
      : null;

    if (existing) {
      Object.assign(existing, achievement);
      return this.achievementRepo.save(existing);
    }

    const created = this.achievementRepo.create(achievement);
    return this.achievementRepo.save(created);
  }
}
