import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaveGameAnalytics } from '../entities/save-game-analytics.entity';
import { SaveType, SaveAnalytics } from '../interfaces/save-game.interfaces';

@Injectable()
export class SaveAnalyticsService {
  private readonly logger = new Logger(SaveAnalyticsService.name);

  constructor(
    @InjectRepository(SaveGameAnalytics)
    private readonly analyticsRepo: Repository<SaveGameAnalytics>,
  ) {}

  async getOrCreateAnalytics(userId: string): Promise<SaveGameAnalytics> {
    let analytics = await this.analyticsRepo.findOne({ where: { userId } });

    if (!analytics) {
      analytics = this.analyticsRepo.create({ userId });
      analytics = await this.analyticsRepo.save(analytics);
    }

    return analytics;
  }

  async recordSave(
    userId: string,
    saveType: SaveType,
    dataSize: number,
  ): Promise<void> {
    const analytics = await this.getOrCreateAnalytics(userId);

    analytics.totalSaves++;
    analytics.lastSaveAt = new Date();
    analytics.totalDataSaved = Number(analytics.totalDataSaved) + dataSize;

    // Update average save size
    analytics.averageSaveSize =
      Number(analytics.totalDataSaved) / analytics.totalSaves;

    switch (saveType) {
      case SaveType.AUTO:
        analytics.autoSaves++;
        break;
      case SaveType.MANUAL:
        analytics.manualSaves++;
        break;
      case SaveType.QUICKSAVE:
        analytics.quickSaves++;
        break;
    }

    await this.analyticsRepo.save(analytics);
  }

  async recordLoad(userId: string): Promise<void> {
    const analytics = await this.getOrCreateAnalytics(userId);

    analytics.totalLoads++;
    analytics.lastLoadAt = new Date();

    await this.analyticsRepo.save(analytics);
  }

  async recordSync(userId: string, hadConflict: boolean): Promise<void> {
    const analytics = await this.getOrCreateAnalytics(userId);

    analytics.cloudSyncs++;
    analytics.lastSyncAt = new Date();

    if (hadConflict) {
      analytics.syncConflicts++;
    }

    await this.analyticsRepo.save(analytics);
  }

  async recordConflictResolved(userId: string): Promise<void> {
    const analytics = await this.getOrCreateAnalytics(userId);
    analytics.conflictsResolved++;
    await this.analyticsRepo.save(analytics);
  }

  async recordCorruption(userId: string): Promise<void> {
    const analytics = await this.getOrCreateAnalytics(userId);
    analytics.corruptionEvents++;
    await this.analyticsRepo.save(analytics);
  }

  async recordRecoveryAttempt(userId: string, success: boolean): Promise<void> {
    const analytics = await this.getOrCreateAnalytics(userId);

    analytics.recoveryAttempts++;
    if (success) {
      analytics.successfulRecoveries++;
    }

    await this.analyticsRepo.save(analytics);
  }

  async getAnalytics(userId: string): Promise<SaveAnalytics> {
    const analytics = await this.getOrCreateAnalytics(userId);

    return {
      totalSaves: analytics.totalSaves,
      totalLoads: analytics.totalLoads,
      autoSaves: analytics.autoSaves,
      manualSaves: analytics.manualSaves,
      cloudSyncs: analytics.cloudSyncs,
      syncConflicts: analytics.syncConflicts,
      corruptionEvents: analytics.corruptionEvents,
      lastSaveAt: analytics.lastSaveAt,
      lastLoadAt: analytics.lastLoadAt,
      averageSaveSize: analytics.averageSaveSize,
    };
  }

  async getGlobalStats(): Promise<{
    totalUsers: number;
    totalSaves: number;
    totalSyncs: number;
    averageConflictRate: number;
    averageCorruptionRate: number;
  }> {
    const result = await this.analyticsRepo
      .createQueryBuilder('analytics')
      .select('COUNT(DISTINCT analytics.userId)', 'totalUsers')
      .addSelect('SUM(analytics.totalSaves)', 'totalSaves')
      .addSelect('SUM(analytics.cloudSyncs)', 'totalSyncs')
      .addSelect('AVG(CASE WHEN analytics.cloudSyncs > 0 THEN analytics.syncConflicts::float / analytics.cloudSyncs ELSE 0 END)', 'avgConflictRate')
      .addSelect('AVG(CASE WHEN analytics.totalSaves > 0 THEN analytics.corruptionEvents::float / analytics.totalSaves ELSE 0 END)', 'avgCorruptionRate')
      .getRawOne();

    return {
      totalUsers: parseInt(result.totalUsers) || 0,
      totalSaves: parseInt(result.totalSaves) || 0,
      totalSyncs: parseInt(result.totalSyncs) || 0,
      averageConflictRate: parseFloat(result.avgConflictRate) || 0,
      averageCorruptionRate: parseFloat(result.avgCorruptionRate) || 0,
    };
  }
}
