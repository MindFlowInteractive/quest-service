import { Injectable, Inject } from '@nestjs/common';
import { PrivacySettings, PrivacyLevel, UserId } from '../../domain/entities/domain-entities';
import {
  IPrivacySettingsRepository,
  ICacheService,
  IFriendshipRepository,
} from '../../domain/repositories/repository-interfaces';

@Injectable()
export class PrivacyService {
  constructor(
    @Inject('IPrivacySettingsRepository')
    private privacySettingsRepo: IPrivacySettingsRepository,
    @Inject('ICacheService')
    private cacheService: ICacheService,
    @Inject('IFriendshipRepository')
    private friendshipRepo: IFriendshipRepository,
  ) {}

  /**
   * Get privacy settings for a user.
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    const cacheKey = `privacy:${userId}`;
    const cached = await this.cacheService.get<PrivacySettings>(cacheKey);

    if (cached) {
      return cached;
    }

    const settings = await this.privacySettingsRepo.findByUserId(userId);
    if (!settings) {
      // Create default privacy settings
      const defaultSettings = new PrivacySettings({
        userId: new UserId(userId),
        profileVisibility: PrivacyLevel.PUBLIC,
        showActivityTo: PrivacyLevel.FRIENDS_ONLY,
        leaderboardVisibility: PrivacyLevel.PUBLIC,
      });
      await this.privacySettingsRepo.save(defaultSettings);
      await this.cacheService.set(cacheKey, defaultSettings, 3600);
      return defaultSettings;
    }

    await this.cacheService.set(cacheKey, settings, 3600);
    return settings;
  }

  /**
   * Update privacy settings.
   */
  async updatePrivacySettings(
    userId: string,
    updates: Partial<{
      profileVisibility: PrivacyLevel;
      showActivityTo: PrivacyLevel;
      leaderboardVisibility: PrivacyLevel;
    }>,
  ): Promise<PrivacySettings> {
    const settings = await this.getPrivacySettings(userId);

    if (updates.profileVisibility) {
      settings.profileVisibility = updates.profileVisibility;
    }
    if (updates.showActivityTo) {
      settings.showActivityTo = updates.showActivityTo;
    }
    if (updates.leaderboardVisibility) {
      settings.leaderboardVisibility = updates.leaderboardVisibility;
    }

    settings.updatedAt = new Date();
    await this.privacySettingsRepo.save(settings);

    // Invalidate cache
    await this.cacheService.del(`privacy:${userId}`);

    return settings;
  }

  /**
   * Check if profile is visible to viewer.
   */
  async isProfileVisible(
    targetUserId: string,
    viewerId: string,
  ): Promise<boolean> {
    if (targetUserId === viewerId) return true;

    const settings = await this.getPrivacySettings(targetUserId);

    if (settings.profileVisibility === PrivacyLevel.PUBLIC) {
      return true;
    }

    if (settings.profileVisibility === PrivacyLevel.PRIVATE) {
      return false;
    }

    // FRIENDS_ONLY
    return this.friendshipRepo.isFriend(viewerId, targetUserId);
  }

  /**
   * Check if activity is visible to viewer.
   */
  async isActivityVisible(
    actorUserId: string,
    viewerId: string,
  ): Promise<boolean> {
    if (actorUserId === viewerId) return true;

    const settings = await this.getPrivacySettings(actorUserId);

    if (settings.showActivityTo === PrivacyLevel.PUBLIC) {
      return true;
    }

    if (settings.showActivityTo === PrivacyLevel.PRIVATE) {
      return false;
    }

    // FRIENDS_ONLY
    return this.friendshipRepo.isFriend(viewerId, actorUserId);
  }

  /**
   * Check if leaderboard entry is visible to viewer.
   */
  async isLeaderboardVisible(
    userId: string,
    viewerId: string,
  ): Promise<boolean> {
    if (userId === viewerId) return true;

    const settings = await this.getPrivacySettings(userId);

    if (settings.leaderboardVisibility === PrivacyLevel.PUBLIC) {
      return true;
    }

    if (settings.leaderboardVisibility === PrivacyLevel.PRIVATE) {
      return false;
    }

    // FRIENDS_ONLY
    return this.friendshipRepo.isFriend(viewerId, userId);
  }

  /**
   * Batch check profile visibility.
   */
  async checkProfileVisibilityBatch(
    userIds: string[],
    viewerId: string,
  ): Promise<Map<string, boolean>> {
    const settingsMap = await this.privacySettingsRepo.findByUserIds(userIds);
    const result = new Map<string, boolean>();

    for (const userId of userIds) {
      if (userId === viewerId) {
        result.set(userId, true);
        continue;
      }

      const settings = settingsMap.get(userId);
      if (!settings) {
        result.set(userId, true); // Default to public
        continue;
      }

      if (settings.profileVisibility === PrivacyLevel.PUBLIC) {
        result.set(userId, true);
      } else if (settings.profileVisibility === PrivacyLevel.PRIVATE) {
        result.set(userId, false);
      } else {
        // FRIENDS_ONLY - would need to check friendship separately
        result.set(userId, null); // Mark for separate check
      }
    }

    // Handle FRIENDS_ONLY cases
    const friendsOnlyIds = Array.from(result.entries())
      .filter(([_, visible]) => visible === null)
      .map(([id]) => id);

    if (friendsOnlyIds.length > 0) {
      const friendshipChecks = await Promise.all(
        friendsOnlyIds.map((id) => this.friendshipRepo.isFriend(viewerId, id)),
      );

      friendsOnlyIds.forEach((id, index) => {
        result.set(id, friendshipChecks[index]);
      });
    }

    return result;
  }
}
