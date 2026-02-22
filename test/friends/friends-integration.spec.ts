import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import { FriendRequestService } from '../../src/friends/application/services/friend-request.service';
import { FriendshipService } from '../../src/friends/application/services/friendship.service';
import { ActivityFeedService } from '../../src/friends/application/services/activity-feed.service';
import { PrivacyService } from '../../src/friends/application/services/privacy.service';
import {
  IFriendRequestRepository,
  IFriendshipRepository,
  IBlockRepository,
  ICacheService,
  IEventPublisher,
  IUserService,
  IActivityEventRepository,
  IPrivacySettingsRepository,
} from '../../src/friends/domain/repositories/repository-interfaces';
import {
  FriendRequest,
  FriendRequestState,
  UserId,
  Friendship,
  ActivityEventType,
  PrivacyLevel,
} from '../../src/friends/domain/entities/domain-entities';

describe('Friends System Integration Tests', () => {
  let friendRequestService: FriendRequestService;
  let friendshipService: FriendshipService;
  let activityFeedService: ActivityFeedService;
  let privacyService: PrivacyService;
  let mockFriendRequestRepo: jest.Mocked<IFriendRequestRepository>;
  let mockFriendshipRepo: jest.Mocked<IFriendshipRepository>;
  let mockActivityEventRepo: jest.Mocked<IActivityEventRepository>;
  let mockPrivacySettingsRepo: jest.Mocked<IPrivacySettingsRepository>;
  let mockBlockRepo: jest.Mocked<IBlockRepository>;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;
  let mockUserService: jest.Mocked<IUserService>;

  beforeEach(async () => {
    // Setup mocks
    mockFriendRequestRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUsersPair: jest.fn(),
      findInboundByUserId: jest.fn(),
      findOutboundByUserId: jest.fn(),
      findByIds: jest.fn(),
      deletePermanently: jest.fn(),
    };

    mockFriendshipRepo = {
      save: jest.fn(),
      saveBatch: jest.fn(),
      findById: jest.fn(),
      findBothDirections: jest.fn(),
      findFriendsOfUser: jest.fn(),
      findFriendCountByUserId: jest.fn(),
      delete: jest.fn(),
      deleteBatch: jest.fn(),
      exists: jest.fn(),
      isFriend: jest.fn(),
      getMutualFriendsCount: jest.fn(),
      getMutualFriendsIds: jest.fn(),
    };

    mockActivityEventRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByActorUserId: jest.fn(),
      findRecentByActorIds: jest.fn(),
      countByActorUserId: jest.fn(),
      findByIds: jest.fn(),
    };

    mockPrivacySettingsRepo = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIds: jest.fn(),
    };

    mockBlockRepo = {
      save: jest.fn(),
      isBlocked: jest.fn(),
      unblock: jest.fn(),
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
      smembers: jest.fn(),
      sismember: jest.fn(),
      zadd: jest.fn(),
      zrem: jest.fn(),
      zrange: jest.fn(),
      zrevrange: jest.fn(),
      zcard: jest.fn(),
      zcount: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      zinterstore: jest.fn(),
      zrangebyscore: jest.fn(),
    };

    mockEventPublisher = {
      publishEvent: jest.fn(),
      subscribeToEvent: jest.fn(),
    };

    mockUserService = {
      getUserById: jest.fn(),
      ungetUsersByIds: jest.fn(),
      checkUserExists: jest.fn(),
      searchUsers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendRequestService,
        FriendshipService,
        ActivityFeedService,
        PrivacyService,
        { provide: 'IFriendRequestRepository', useValue: mockFriendRequestRepo },
        { provide: 'IFriendshipRepository', useValue: mockFriendshipRepo },
        { provide: 'IActivityEventRepository', useValue: mockActivityEventRepo },
        { provide: 'IPrivacySettingsRepository', useValue: mockPrivacySettingsRepo },
        { provide: 'IBlockRepository', useValue: mockBlockRepo },
        { provide: 'ICacheService', useValue: mockCacheService },
        { provide: 'IEventPublisher', useValue: mockEventPublisher },
        { provide: 'IUserService', useValue: mockUserService },
      ],
    }).compile();

    friendRequestService = module.get<FriendRequestService>(FriendRequestService);
    friendshipService = module.get<FriendshipService>(FriendshipService);
    activityFeedService = module.get<ActivityFeedService>(ActivityFeedService);
    privacyService = module.get<PrivacyService>(PrivacyService);
  });

  describe('Complete Friend Request Flow', () => {
    it('should complete full flow: send request -> accept -> verify friendship', async () => {
      const userId1 = uuidv4();
      const userId2 = uuidv4();

      // Step 1: Send friend request
      mockUserService.checkUserExists.mockResolvedValueOnce(true);
      mockUserService.checkUserExists.mockResolvedValueOnce(true);
      mockBlockRepo.isBlocked.mockResolvedValueOnce(false);
      mockFriendRequestRepo.findOutboundByUserId.mockResolvedValueOnce([]);
      mockFriendshipRepo.isFriend.mockResolvedValueOnce(false);
      mockFriendRequestRepo.findByUsersPair.mockResolvedValueOnce(null);
      mockFriendRequestRepo.findByUsersPair.mockResolvedValueOnce(null);

      const request = await friendRequestService.sendFriendRequest(userId1, userId2);
      expect(request.state).toBe(FriendRequestState.PENDING);
      expect(mockEventPublisher.publishEvent).toHaveBeenCalledTimes(1);

      // Step 2: Accept friend request
      mockFriendRequestRepo.findById.mockResolvedValueOnce(request);
      mockFriendshipRepo.saveBatch.mockResolvedValueOnce(undefined);
      mockFriendRequestRepo.save.mockResolvedValueOnce(undefined);
      mockEventPublisher.publishEvent.mockResolvedValueOnce(undefined);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await friendRequestService.acceptFriendRequest(request.id, userId2);
      expect(result.friendshipCreated).toBe(true);
      expect(mockFriendshipRepo.saveBatch).toHaveBeenCalled();
      expect(mockEventPublisher.publishEvent).toHaveBeenCalledTimes(2);

      // Step 3: Verify friendship exists
      mockFriendshipRepo.isFriend.mockResolvedValueOnce(true);
      const areFriends = await friendshipService.areFriends(userId1, userId2);
      expect(areFriends).toBe(true);
    });

    it('should handle bidirectional friendships correctly', async () => {
      const userId1 = uuidv4();
      const userId2 = uuidv4();

      // Create bidirectional friendship
      const friendship1 = new Friendship({
        id: uuidv4(),
        userId: new UserId(userId1),
        friendId: new UserId(userId2),
      });

      const friendship2 = new Friendship({
        id: uuidv4(),
        userId: new UserId(userId2),
        friendId: new UserId(userId1),
      });

      mockFriendshipRepo.findBothDirections.mockResolvedValueOnce([friendship1, friendship2]);
      mockFriendshipRepo.delete.mockResolvedValueOnce(undefined);

      // Remove friend
      await friendshipService.removeFriend(userId1, userId2);

      expect(mockFriendshipRepo.delete).toHaveBeenCalledWith(userId1, userId2);
      expect(mockFriendshipRepo.delete).toHaveBeenCalledWith(userId2, userId1);
    });
  });

  describe('Privacy Enforcement', () => {
    it('should enforce FRIENDS_ONLY visibility', async () => {
      const userId1 = uuidv4();
      const userId2 = uuidv4();
      const viewer = uuidv4();

      // User1 has FRIENDS_ONLY profile visibility
      const privacySettings = {
        userId: new UserId(userId1),
        profileVisibility: PrivacyLevel.FRIENDS_ONLY,
        showActivityTo: PrivacyLevel.FRIENDS_ONLY,
        leaderboardVisibility: PrivacyLevel.FRIENDS_ONLY,
      };

      mockPrivacySettingsRepo.findByUserId.mockResolvedValueOnce(privacySettings as any);

      // Viewer is not a friend
      mockFriendshipRepo.isFriend.mockResolvedValueOnce(false);

      const isVisible = await privacyService.isProfileVisible(userId1, viewer);
      expect(isVisible).toBe(false);

      // Now viewer is a friend
      mockPrivacySettingsRepo.findByUserId.mockResolvedValueOnce(privacySettings as any);
      mockFriendshipRepo.isFriend.mockResolvedValueOnce(true);

      const isVisibleToFriend = await privacyService.isProfileVisible(userId1, viewer);
      expect(isVisibleToFriend).toBe(true);
    });

    it('should enforce PUBLIC visibility', async () => {
      const userId1 = uuidv4();
      const viewer = uuidv4();

      const privacySettings = {
        userId: new UserId(userId1),
        profileVisibility: PrivacyLevel.PUBLIC,
        showActivityTo: PrivacyLevel.PUBLIC,
        leaderboardVisibility: PrivacyLevel.PUBLIC,
      };

      mockPrivacySettingsRepo.findByUserId.mockResolvedValueOnce(privacySettings as any);

      const isVisible = await privacyService.isProfileVisible(userId1, viewer);
      expect(isVisible).toBe(true);

      mockPrivacySettingsRepo.findByUserId.mockResolvedValueOnce(privacySettings as any);

      const isActivityVisible = await privacyService.isActivityVisible(userId1, viewer);
      expect(isActivityVisible).toBe(true);
    });

    it('should enforce PRIVATE visibility', async () => {
      const userId1 = uuidv4();
      const viewer = uuidv4();

      const privacySettings = {
        userId: new UserId(userId1),
        profileVisibility: PrivacyLevel.PRIVATE,
        showActivityTo: PrivacyLevel.PRIVATE,
        leaderboardVisibility: PrivacyLevel.PRIVATE,
      };

      mockPrivacySettingsRepo.findByUserId.mockResolvedValueOnce(privacySettings as any);

      const isVisible = await privacyService.isProfileVisible(userId1, viewer);
      expect(isVisible).toBe(false);

      // But owner can always see their own profile
      const isOwnProfileVisible = await privacyService.isProfileVisible(userId1, userId1);
      expect(isOwnProfileVisible).toBe(true);
    });
  });

  describe('Activity Feed Concurrency', () => {
    it('should handle concurrent activity events', async () => {
      const userId = uuidv4();
      const friendIds = [uuidv4(), uuidv4(), uuidv4()];

      // Simulate concurrent activity events from friends
      const events = await Promise.all([
        activityFeedService.recordActivity(
          friendIds[0],
          ActivityEventType.GAME_PLAYED,
          { gameId: uuidv4() },
        ),
        activityFeedService.recordActivity(
          friendIds[1],
          ActivityEventType.SCORE_ACHIEVED,
          { score: 1000 },
        ),
        activityFeedService.recordActivity(
          friendIds[2],
          ActivityEventType.LEVEL_UP,
          { level: 5 },
        ),
      ]);

      expect(events).toHaveLength(3);
      expect(mockActivityEventRepo.save).toHaveBeenCalledTimes(3);
      expect(mockEventPublisher.publishEvent).toHaveBeenCalledTimes(3);
    });
  });

  describe('Mutual Friends Calculation', () => {
    it('should correctly calculate mutual friends', async () => {
      const userId1 = uuidv4();
      const userId2 = uuidv4();

      mockFriendshipRepo.getMutualFriendsCount.mockResolvedValueOnce(3);

      const count = await friendshipService.getMutualFriendsCount(userId1, userId2);
      expect(count).toBe(3);

      mockFriendshipRepo.getMutualFriendsIds.mockResolvedValueOnce([
        uuidv4(),
        uuidv4(),
        uuidv4(),
      ]);

      const ids = await friendshipService.getMutualFriendsIds(userId1, userId2);
      expect(ids).toHaveLength(3);
    });
  });

  describe('Cache Population', () => {
    it('should populate and maintain friend set cache', async () => {
      const userId = uuidv4();
      const friendIds = [uuidv4(), uuidv4(), uuidv4()];

      const friendships = friendIds.map(
        (id) =>
          new Friendship({
            id: uuidv4(),
            userId: new UserId(userId),
            friendId: new UserId(id),
          }),
      );

      mockFriendshipRepo.findFriendsOfUser.mockResolvedValueOnce(friendships);
      mockCacheService.sadd.mockResolvedValueOnce(3);
      mockCacheService.expire.mockResolvedValueOnce(undefined);

      await friendshipService.cacheFriendSet(userId);

      expect(mockCacheService.sadd).toHaveBeenCalledWith(
        `friends:set:${userId}`,
        friendIds,
      );
      expect(mockCacheService.expire).toHaveBeenCalledWith(
        `friends:set:${userId}`,
        3600,
      );
    });

    it('should retrieve cached friend set or populate if missing', async () => {
      const userId = uuidv4();

      // Cache miss
      mockCacheService.smembers.mockResolvedValueOnce([]);
      const friendships = [
        new Friendship({
          id: uuidv4(),
          userId: new UserId(userId),
          friendId: new UserId(uuidv4()),
        }),
      ];
      mockFriendshipRepo.findFriendsOfUser.mockResolvedValueOnce(friendships);
      mockCacheService.sadd.mockResolvedValueOnce(1);
      mockCacheService.expire.mockResolvedValueOnce(undefined);

      const friendSet = await friendshipService.getFriendSet(userId);

      expect(mockFriendshipRepo.findFriendsOfUser).toHaveBeenCalled();
      expect(friendSet).toBeInstanceOf(Set);
    });
  });
});
