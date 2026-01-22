import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { isYesterday, isToday } from 'date-fns';
import { UserProgress } from '../entities/user-progress.entity';
import { User } from '../../users/entities/user.entity';
import { checkNewAchievements } from '../logic/achievement-checker';
import { UserAchievement } from '../entities/user-achievement.entity';
import { calculateLevel } from '../utils/level.utils';
import { MilestoneService } from '../milestone/milestone.service';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

@Injectable()
export class UserProgressService {
  constructor(
    @InjectRepository(UserProgress)
    private readonly userProgressRepository: Repository<UserProgress>,

    @InjectRepository(UserAchievement)
    private readonly achievementRepo: Repository<UserAchievement>,

    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,

    private readonly milestoneService: MilestoneService,
  ) {}

  async getXpDistribution() {
    const progressList = await this.userProgressRepository.find();
    const distribution = progressList.reduce((acc, progress) => {
      const range = `${Math.floor(progress.xp / 1000) * 1000}-${
        Math.floor(progress.xp / 1000) * 1000 + 999
      }`;
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return distribution;
  }

  async getAchievementsSummary() {
    const progressList = await this.userProgressRepository.find({ relations: ['achievements'] });
    const summary = {
      totalUsers: progressList.length,
      totalAchievementsUnlocked: progressList.reduce(
        (sum, p) => sum + (p.achievements?.length || 0),
        0,
      ),
      averageAchievements: 0,
    };
    summary.averageAchievements = summary.totalAchievementsUnlocked / summary.totalUsers;
    return summary;
  }

  async getTopStreaks() {
    const progressList = await this.userProgressRepository.find({
      order: { currentStreak: 'DESC' },
      take: 10,
    });
    return progressList.map((p) => ({ userId: p.userId, currentStreak: p.currentStreak }));
  }

  async getOrCreateProgress(user: User): Promise<UserProgress> {
    let progress = await this.userProgressRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['user'],
    });

    if (!progress) {
      progress = this.userProgressRepository.create({
        user,
        xp: 0,
        level: 1,
        puzzlesCompleted: 0,
        streakDays: 0,
      });
      await this.userProgressRepository.save(progress);
    }

    return progress;
  }

  async incrementXP(user: User, xpEarned: number): Promise<UserProgress> {
    const progress = await this.getOrCreateProgress(user);
    progress.xp += xpEarned;

    const result = calculateLevel(progress.xp);
    progress.level = result.level;

    await this.userProgressRepository.save(progress);
    return progress;
  }

  async completePuzzle(user: User): Promise<UserProgress> {
    const progress = await this.getOrCreateProgress(user);
    progress.puzzlesCompleted += 1;
    progress.lastPuzzleCompletedAt = new Date();

    return this.userProgressRepository.save(progress);
  }

  private updateStreak(lastDate: Date | null): number {
    if (!lastDate) return 1;

    const now = new Date();
    if (isYesterday(lastDate)) return 1;
    if (isToday(lastDate)) return 0;

    return -1;
  }

  async incrementPuzzlesCompleted(userId: string) {
    const progress = await this.userProgressRepository.findOne({
      where: { userId },
      relations: ['achievements'],
    });
    if (!progress) throw new NotFoundException('User progress not found');

    progress.puzzlesCompleted += 1;
    progress.xp += 10;

    const streakUpdate = this.updateStreak(progress.lastPuzzleCompletedAt);
    progress.streakDays =
      streakUpdate === 1
        ? progress.streakDays + 1
        : streakUpdate === -1
        ? 1
        : progress.streakDays;
    progress.lastPuzzleCompletedAt = new Date();

    const newAchievements = checkNewAchievements(progress, progress.achievements || []);
    const updatedProgress = await this.userProgressRepository.save(progress);

    if (newAchievements.length > 0) {
      await this.achievementRepo.save(newAchievements);
    }

    return { progress: updatedProgress, unlocked: newAchievements };
  }

  async getLeaderboard(metric: 'xp' | 'level' | 'streak', limit = 10) {
    const qb = this.userProgressRepository
      .createQueryBuilder('progress')
      .innerJoinAndSelect('progress.user', 'user')
      .orderBy(`progress.${metric}`, 'DESC')
      .limit(limit);

    const rawResults = await qb.getMany();

    return rawResults.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user.id,
      username: entry.user.username,
      xp: entry.xp,
      level: entry.level,
      currentStreak: entry.currentStreak,
      puzzlesCompleted: entry.puzzlesCompleted,
    }));
  }

  async getTopUsersByXp(limit = 10) {
    const topUsers = await this.userProgressRepository.find({
      order: { xp: 'DESC' },
      take: limit,
      select: ['userId', 'xp', 'level'],
    });

    return topUsers.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      xp: user.xp,
      level: user.level ?? this.calculateLevel(user.xp),
    }));
  }

  calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100));
  }

  async backupAllProgress() {
    const allProgress = await this.userProgressRepository.find();
    return allProgress;
  }

  private handleMilestoneNotifications(userId: string, messages: string[]) {
    for (const message of messages) {
      console.log(`[Milestone] User ${userId}: ${message}`);
      // Future: send via email, push, or in-app notification
    }
  }

  async getRecommendedPuzzles(userId: string) {
    const progress = await this.userProgressRepository.findOne({
      where: { userId },
      relations: ['solvedPuzzles'],
    });

    if (!progress) throw new Error('User progress not found');

    const currentLevel = this.calculateLevel(progress.xp);
    const solvedPuzzleIds = progress.solvedPuzzles?.map((p: any) => typeof p === 'string' ? p : p.id) || [];

    const recommended = await this.puzzleRepository.find({
      where: {
        id: Not(In(solvedPuzzleIds)),
        difficulty: Between(Math.max(currentLevel - 1, 1).toString(), (currentLevel + 2).toString()) as any,
      },
      take: 5,
    });

    return recommended;
  }
}
