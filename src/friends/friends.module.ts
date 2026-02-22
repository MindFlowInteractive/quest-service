import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendsController } from './api/controllers/friends.controller';
import { FriendRequestService } from './application/services/friend-request.service';
import { FriendshipService } from './application/services/friendship.service';
import { ActivityFeedService } from './application/services/activity-feed.service';
import { PrivacyService } from './application/services/privacy.service';
import { RecommendationService } from './application/services/recommendation.service';
import { PostgresFriendRequestRepository } from './infrastructure/persistence/friend-request.repository';
import { PostgresFriendshipRepository } from './infrastructure/persistence/friendship.repository';
import { PostgresPrivacySettingsRepository } from './infrastructure/persistence/privacy-settings.repository';
import { PostgresActivityEventRepository } from './infrastructure/persistence/activity-event.repository';
import { PostgresBlockRepository } from './infrastructure/persistence/block.repository';
import { RedisCacheService } from './infrastructure/cache/redis-cache.service';
import { FriendEventHandlers } from './infrastructure/events/event-handlers';
import { JwtAuthGuard } from './api/guards/jwt-auth.guard';
import { RateLimitGuard } from './api/guards/rate-limit.guard';

@Module({
  imports: [
    // TypeORM entities
    TypeOrmModule.forFeature([]),
  ],
  controllers: [FriendsController],
  providers: [
    // Services
    FriendRequestService,
    FriendshipService,
    ActivityFeedService,
    PrivacyService,
    RecommendationService,
    // Repositories
    {
      provide: 'IFriendRequestRepository',
      useClass: PostgresFriendRequestRepository,
    },
    {
      provide: 'IFriendshipRepository',
      useClass: PostgresFriendshipRepository,
    },
    {
      provide: 'IPrivacySettingsRepository',
      useClass: PostgresPrivacySettingsRepository,
    },
    {
      provide: 'IActivityEventRepository',
      useClass: PostgresActivityEventRepository,
    },
    {
      provide: 'IBlockRepository',
      useClass: PostgresBlockRepository,
    },
    // Cache
    {
      provide: 'ICacheService',
      useClass: RedisCacheService,
    },
    // Event Handlers
    FriendEventHandlers,
    // Guards
    JwtAuthGuard,
    RateLimitGuard,
  ],
  exports: [
    FriendRequestService,
    FriendshipService,
    ActivityFeedService,
    PrivacyService,
    RecommendationService,
  ],
})
export class FriendsModule {}
