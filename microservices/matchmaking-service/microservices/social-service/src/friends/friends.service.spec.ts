import { Test, TestingModule } from '@nestjs/testing';
import { FriendsService } from './friends.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Friend } from './friend.entity';
import { FriendRequest, FriendRequestStatus } from './friend-request.entity';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('FriendsService', () => {
  let service: FriendsService;
  let friendRepository: Repository<Friend>;
  let friendRequestRepository: Repository<FriendRequest>;

  const mockFriendRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockFriendRequestRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        {
          provide: getRepositoryToken(Friend),
          useValue: mockFriendRepository,
        },
        {
          provide: getRepositoryToken(FriendRequest),
          useValue: mockFriendRequestRepository,
        },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
    friendRepository = module.get<Repository<Friend>>(getRepositoryToken(Friend));
    friendRequestRepository = module.get<Repository<FriendRequest>>(
      getRepositoryToken(FriendRequest),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendFriendRequest', () => {
    it('should send a friend request successfully', async () => {
      const requesterId = '123e4567-e89b-12d3-a456-426614174000';
      const recipientId = '123e4567-e89b-12d3-a456-426614174001';

      mockFriendRepository.findOne.mockResolvedValue(null);
      mockFriendRequestRepository.findOne.mockResolvedValue(null);

      const mockRequest = {
        id: '123',
        requesterId,
        recipientId,
        status: FriendRequestStatus.PENDING,
      };

      mockFriendRequestRepository.create.mockReturnValue(mockRequest);
      mockFriendRequestRepository.save.mockResolvedValue(mockRequest);

      const result = await service.sendFriendRequest(requesterId, {
        recipientId,
      });

      expect(result).toEqual(mockRequest);
      expect(mockFriendRequestRepository.create).toHaveBeenCalled();
      expect(mockFriendRequestRepository.save).toHaveBeenCalled();
    });

    it('should throw error when sending request to self', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      await expect(
        service.sendFriendRequest(userId, { recipientId: userId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if already friends', async () => {
      const requesterId = '123e4567-e89b-12d3-a456-426614174000';
      const recipientId = '123e4567-e89b-12d3-a456-426614174001';

      mockFriendRepository.findOne.mockResolvedValue({
        userId: requesterId,
        friendId: recipientId,
      });

      await expect(
        service.sendFriendRequest(requesterId, { recipientId }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFriends', () => {
    it('should return list of friends', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFriends = [
        { userId, friendId: '456', createdAt: new Date() },
        { userId, friendId: '789', createdAt: new Date() },
      ];

      mockFriendRepository.find.mockResolvedValue(mockFriends);

      const result = await service.getFriends(userId);

      expect(result).toEqual(mockFriends);
      expect(mockFriendRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('areFriends', () => {
    it('should return true if users are friends', async () => {
      const userId1 = '123e4567-e89b-12d3-a456-426614174000';
      const userId2 = '123e4567-e89b-12d3-a456-426614174001';

      mockFriendRepository.findOne.mockResolvedValue({
        userId: userId1,
        friendId: userId2,
      });

      const result = await service.areFriends(userId1, userId2);

      expect(result).toBe(true);
    });

    it('should return false if users are not friends', async () => {
      const userId1 = '123e4567-e89b-12d3-a456-426614174000';
      const userId2 = '123e4567-e89b-12d3-a456-426614174001';

      mockFriendRepository.findOne.mockResolvedValue(null);

      const result = await service.areFriends(userId1, userId2);

      expect(result).toBe(false);
    });
  });
});
