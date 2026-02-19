import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress } from '../entities/user-progress.entity';
import { checkNewAchievements } from '../logic/achievement-checker';
import { UserAchievement } from '../entities/user-achievement.entity';
import { calculateLevel } from '../utils/level.utils';
import { MilestoneService } from '../milestone/milestone.service';

@Injectable()
export class UserProgressService {
  constructor(
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
    @InjectRepository(UserAchievement)
    private readonly achievementRepo: Repository<UserAchievement>,
    private readonly milestoneService: MilestoneService,
  ) {}

  async getProgress(userId: string): Promise<UserProgress> {
    const progress = await this.progressRepo.findOne({
      where: { userId },
      relations: ['achievements'],
    });
    if (!progress) {
      throw new NotFoundException(`Progress not found for user ${userId}`);
    }
    return progress;
  }

  async addXp(userId: string, xp: number): Promise<UserProgress> {
    let progress = await this.progressRepo.findOne({ where: { userId } });
    if (!progress) {
      progress = this.progressRepo.create({ userId, xp: 0 });
    }
    progress.xp += xp;
    const levelData = calculateLevel(progress.xp);
    progress.level = levelData.level;
    return this.progressRepo.save(progress);
  }

  async recordPuzzleCompletion(userId: string, puzzleId: string): Promise<UserProgress> {
    let progress = await this.progressRepo.findOne({
      where: { userId },
      relations: ['achievements'],
    });
    if (!progress) {
      progress = this.progressRepo.create({ userId });
    }

    progress.puzzlesCompleted += 1;
    if (!progress.solvedPuzzles.includes(puzzleId)) {
      progress.solvedPuzzles.push(puzzleId);
    }
    progress.lastPuzzleCompletedAt = new Date();

    // Check achievements
    const currentAchievements = await this.achievementRepo.find({ where: { userId } });
    const newAchievements = checkNewAchievements(progress, currentAchievements);
    if (newAchievements.length > 0) {
      await this.achievementRepo.save(newAchievements);
    }

    // Check milestones
    await this.milestoneService.detectMilestones(progress);

    return this.progressRepo.save(progress);
  }
}
