import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import { FriendRequestService } from '../../src/friends/application/services/friend-request.service';
import {
  IFriendRequestRepository,
  IFriendshipRepository,
  IBlockRepository,
  ICacheService,
  IEventPublisher,
  IUserService,
} from '../../src/friends/domain/repositories/repository-interfaces';
import {
  FriendRequest,
  FriendRequestState,
  UserId,
} from '../../src/friends/domain/entities/domain-entities';
import {
  FriendRequestAlreadyExistsException,
  SelfFriendRequestException,
  UserBlockedException,
  FriendshipAlreadyExistsException,
  RateLimitExceededException,
  UnauthorizedAccessException,
  FriendRequestNotFoundException,
} from '../../src/friends/domain/exceptions/domain-exceptions';

describe('FriendRequestService', () => {
  let service: FriendRequestService;
  let mockFriendRequestRepo: jest.Mocked<IFriendRequestRepository>;
  let mockFriendshipRepo: jest.Mocked<IFriendshipRepository>;
  let mockBlockRepo: jest.Mocked<IBlockRepository>;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;
  let mockUserService: jest.Mocked<IUserService>;

  beforeEach(async () => {
    // Mock repositories
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
        { provide: 'IFriendRequestRepository', useValue: mockFriendRequestRepo },
        { provide: 'IFriendshipRepository', useValue: mockFriendshipRepo },
        { provide: 'IBlockRepository', useValue: mockBlockRepo },
        { provide: 'ICacheService', useValue: mockCacheService },
        { provide: 'IEventPublisher', useValue: mockEventPublisher },
        { provide: 'IUserService', useValue: mockUserService },
      ],
    }).compile();

    service = module.get<FriendRequestService>(FriendRequestService);
  });

  describe('sendFriendRequest', () => {
    it('should successfully send a friend request', async () => {
      const userId = uuidv4();
      const toUserId = uuidv4();

      mockUserService.checkUserExists.mockResolvedValueOnce(true);
      mockUserService.checkUserExists.mockResolvedValueOnce(true);
      mockBlockRepo.isBlocked.mockResolvedValueOnce(false);
      mockFriendRequestRepo.findOutboundByUserId.mockResolvedValueOnce([]);
      mockFriendshipRepo.isFriend.mockResolvedValueOnce(false);
      mockFriendRequestRepo.findByUsersPair.mockResolvedValueOnce(null);
      mockFriendRequestRepo.findByUsersPair.mockResolvedValueOnce(null);

      const result = await service.sendFriendRequest(userId, toUserId, 'Hi, let\'s be friends!');

      expect(result).toBeDefined();
      expect(result.fromUserId.value).toBe(userId);
      expect(result.toUserId.value).toBe(toUserId);
      expect(result.state).toBe(FriendRequestState.PENDING);
      expect(mockFriendRequestRepo.save).toHaveBeenCalled();
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled();
    });

    it('should throw error if sender is same as recipient', async () => {
      const userId = uuidv4();

      await expect(service.sendFriendRequest(userId, userId)).rejects.toThrow(
        SelfFriendRequestException,
      );
    });

    it('should throw error if users are already friends', async () => {
      const userId = uuidv4();
      const toUserId = uuidv4();

      mockUserService.checkUserExists.mockResolvedValueOnce(true);
      mockUserService.checkUserExists.mockResolvedValueOnce(true);
      mockBlockRepo.isBlocked.mockResolvedValueOnce(false);
      mockFriendRequestRepo.findOutboundByUserId.mockResolvedValueOnce([]);
      mockFriendshipRepo.isFriend.mockResolvedValueOnce(true);

      await expect(
        service.sendFriendRequest(userId, toUserId),
      ).rejects.toThrow(FriendshipAlreadyExistsException);
    });

    it('should throw error if sender is blocked', async () => {
      const userId = uuidv4();
      const toUserId = uuidv4();

      mockUserService.checkUserExists.mockResolvedValueOnce(true);
      mockUserService.checkUserExists.mockResolvedValueOnce(true);
      mockBlockRepo.isBlocked.mockResolvedValueOnce(true);

      await expect(
        service.sendFriendRequest(userId, toUserId),
      ).rejects.toThrow(UserBlockedException);
    });

    it('should throw error if rate limit exceeded', async () => {
      const userId = uuidv4();
      const toUserId = uuidv4();

      mockUserService.checkUserExists.mockResolvedValueOnce(true);
      mockUserService.checkUserExists.mockResolvedValueOnce(true);
      mockBlockRepo.isBlocked.mockResolvedValueOnce(false);

      // Mock 10 pending outbound requests
      const pendingRequests = Array(10)
        .fill(null)
        .map((_, i) => {
          const req = new FriendRequest({
            id: uuidv4(),
            fromUserId: new UserId(userId),
            toUserId: new UserId(uuidv4()),
            state: FriendRequestState.PENDING,
          });
          return req;
        });

      mockFriendRequestRepo.findOutboundByUserId.mockResolvedValueOnce(pendingRequests);

      await expect(
        service.sendFriendRequest(userId, toUserId),
      ).rejects.toThrow(RateLimitExceededException);
    });
  });

  describe('acceptFriendRequest', () => {
    it('should successfully accept a friend request', async () => {
      const requestId = uuidv4();
      const fromUserId = uuidv4();
      const toUserId = uuidv4();

      const friendRequest = new FriendRequest({
        id: requestId,
        fromUserId: new UserId(fromUserId),
        toUserId: new UserId(toUserId),
        state: FriendRequestState.PENDING,
      });

      mockFriendRequestRepo.findById.mockResolvedValueOnce(friendRequest);
      mockFriendshipRepo.saveBatch.mockResolvedValueOnce(undefined);
      mockFriendRequestRepo.save.mockResolvedValueOnce(undefined);
      mockEventPublisher.publishEvent.mockResolvedValueOnce(undefined);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.acceptFriendRequest(requestId, toUserId);

      expect(result.friendshipCreated).toBe(true);
      expect(result.friendId).toBe(fromUserId);
      expect(mockFriendshipRepo.saveBatch).toHaveBeenCalled();
    });

    it('should throw error if request not found', async () => {
      const requestId = uuidv4();
      const toUserId = uuidv4();

      mockFriendRequestRepo.findById.mockResolvedValueOnce(null);

      await expect(
        service.acceptFriendRequest(requestId, toUserId),
      ).rejects.toThrow(FriendRequestNotFoundException);
    });

    it('should throw error if user is not recipient', async () => {
      const requestId = uuidv4();
      const fromUserId = uuidv4();
      const toUserId = uuidv4();
      const wrongUserId = uuidv4();

      const friendRequest = new FriendRequest({
        id: requestId,
        fromUserId: new UserId(fromUserId),
        toUserId: new UserId(toUserId),
        state: FriendRequestState.PENDING,
      });

      mockFriendRequestRepo.findById.mockResolvedValueOnce(friendRequest);

      await expect(
        service.acceptFriendRequest(requestId, wrongUserId),
      ).rejects.toThrow(UnauthorizedAccessException);
    });
  });

  describe('rejectFriendRequest', () => {
    it('should successfully reject a friend request', async () => {
      const requestId = uuidv4();
      const fromUserId = uuidv4();
      const toUserId = uuidv4();

      const friendRequest = new FriendRequest({
        id: requestId,
        fromUserId: new UserId(fromUserId),
        toUserId: new UserId(toUserId),
        state: FriendRequestState.PENDING,
      });

      mockFriendRequestRepo.findById.mockResolvedValueOnce(friendRequest);
      mockFriendRequestRepo.save.mockResolvedValueOnce(undefined);
      mockCacheService.del.mockResolvedValueOnce(undefined);

      await service.rejectFriendRequest(requestId, toUserId);

      expect(friendRequest.state).toBe(FriendRequestState.REJECTED);
      expect(mockFriendRequestRepo.save).toHaveBeenCalledWith(friendRequest);
    });
  });

  describe('cancelFriendRequest', () => {
    it('should successfully cancel a friend request', async () => {
      const requestId = uuidv4();
      const fromUserId = uuidv4();
      const toUserId = uuidv4();

      const friendRequest = new FriendRequest({
        id: requestId,
        fromUserId: new UserId(fromUserId),
        toUserId: new UserId(toUserId),
        state: FriendRequestState.PENDING,
      });

      mockFriendRequestRepo.findById.mockResolvedValueOnce(friendRequest);
      mockFriendRequestRepo.save.mockResolvedValueOnce(undefined);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.cancelFriendRequest(requestId, fromUserId);

      expect(friendRequest.state).toBe(FriendRequestState.CANCELLED);
      expect(mockFriendRequestRepo.save).toHaveBeenCalledWith(friendRequest);
    });

    it('should throw error if user is not sender', async () => {
      const requestId = uuidv4();
      const fromUserId = uuidv4();
      const toUserId = uuidv4();
      const wrongUserId = uuidv4();

      const friendRequest = new FriendRequest({
        id: requestId,
        fromUserId: new UserId(fromUserId),
        toUserId: new UserId(toUserId),
        state: FriendRequestState.PENDING,
      });

      mockFriendRequestRepo.findById.mockResolvedValueOnce(friendRequest);

      await expect(
        service.cancelFriendRequest(requestId, wrongUserId),
      ).rejects.toThrow(UnauthorizedAccessException);
    });
  });
});
