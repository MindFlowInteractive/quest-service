import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { UserStreak, StreakType } from './entities/user-streak.entity';
import { UserCombo } from './entities/user-combo.entity';

@Injectable()
export class StreaksService {
  private readonly logger = new Logger(StreaksService.name);
  private readonly COMBO_RESET_SECONDS = 300; // 5 minutes
  private readonly COMBO_INCREMENT_STEP = 0.1;
  private readonly MAX_COMBO_MULTIPLIER = 5.0;

  constructor(
    @InjectRepository(UserStreak)
    private streaksRepository: Repository<UserStreak>,
    @InjectRepository(UserCombo)
    private combosRepository: Repository<UserCombo>,
  ) {}

  async recordActivity(userId: string, activityType: 'PUZZLE_COMPLETE') {
    await this.updateStreaks(userId);
    const combo = await this.updateCombo(userId);
    return {
      userId,
      activityType,
      comboMultiplier: combo.currentMultiplier,
    };
  }

  private async updateStreaks(userId: string) {
    const now = new Date();
    await this.updateStreak(userId, StreakType.DAILY, now);
    await this.updateStreak(userId, StreakType.WEEKLY, now);
  }

  private async updateStreak(userId: string, type: StreakType, now: Date) {
    let streak = await this.streaksRepository.findOne({
      where: { userId, streakType: type },
    });

    if (!streak) {
      streak = this.streaksRepository.create({
        userId,
        streakType: type,
        currentStreak: 1,
        maxStreak: 1,
        lastActivityAt: now,
      });
    } else {
      const lastActivity = new Date(streak.lastActivityAt);
      const diffTime = Math.abs(now.getTime() - lastActivity.getTime());
      
      let isConsecutive = false;
      let isSamePeriod = false;

      if (type === StreakType.DAILY) {
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const currentDay = now.getDate();
        const lastDay = lastActivity.getDate();
        
        isSamePeriod = currentDay === lastDay && diffDays === 0;
        // Basic check: if strictly next day or within 24-48h window depending on logic
        // Here we use a simplified "next calendar day" logic or < 48h
        isConsecutive = !isSamePeriod && diffDays <= 1; 
      } else {
        // Weekly logic placeholder - simplified
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        isSamePeriod = diffWeeks === 0;
        isConsecutive = !isSamePeriod && diffWeeks === 1;
      }

      if (isSamePeriod) {
        // Do nothing, already counted for this period
        streak.lastActivityAt = now;
      } else if (isConsecutive) {
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.maxStreak) {
          streak.maxStreak = streak.currentStreak;
        }
        streak.lastActivityAt = now;
      } else {
        // Streak broken
        streak.currentStreak = 1;
        streak.lastActivityAt = now;
      }
    }

    await this.streaksRepository.save(streak);
  }

  private async updateCombo(userId: string): Promise<UserCombo> {
    const now = new Date();
    let combo = await this.combosRepository.findOne({ where: { userId } });

    if (!combo) {
      combo = this.combosRepository.create({
        userId,
        currentMultiplier: 1.0,
        lastActionAt: now,
      });
    } else {
      const diffSeconds = (now.getTime() - combo.lastActionAt.getTime()) / 1000;

      if (diffSeconds <= this.COMBO_RESET_SECONDS) {
        // Maintain/Increment combo
        combo.currentMultiplier = Math.min(
          combo.currentMultiplier + this.COMBO_INCREMENT_STEP,
          this.MAX_COMBO_MULTIPLIER,
        );
      } else {
        // Reset combo
        combo.currentMultiplier = 1.0;
      }
      combo.lastActionAt = now;
    }

    return this.combosRepository.save(combo);
  }

  async getStreaks(userId: string) {
    const streaks = await this.streaksRepository.find({ where: { userId } });
    const combo = await this.combosRepository.findOne({ where: { userId } });
    return {
      streaks,
      combo: combo ? combo.currentMultiplier : 1.0,
    };
  }

  async getLeaderboard(type: StreakType = StreakType.DAILY, limit: number = 10) {
    return this.streaksRepository.find({
      where: { streakType: type },
      order: { currentStreak: 'DESC' },
      take: limit,
    });
  }

  async recoverStreak(userId: string) {
    // Mock implementation for streak recovery
    // specific business logic for checking items/payments would go here
    const dailyStreak = await this.streaksRepository.findOne({
        where: { userId, streakType: StreakType.DAILY }
    });
    
    if (dailyStreak) {
        // Restore logic (e.g. set lastActivityAt to yesterday to allow continuation)
        // For now, we will just log it
        this.logger.log(`Recovering streak for user ${userId}`);
    }
    return { success: true };
  }
}
