import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friend } from '../friend.entity';
import { FriendRequest, FriendRequestStatus } from '../friend-request.entity';
import { CreateFriendRequestDto, UpdateFriendRequestDto } from '../dto';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
  ) {}

  /**
   * Send a friend request from requester to recipient
   */
  async sendFriendRequest(
    requesterId: string,
    dto: CreateFriendRequestDto,
  ): Promise<FriendRequest> {
    const { recipientId } = dto;

    // Validate users are different
    if (requesterId === recipientId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if already friends
    const existingFriendship = await this.friendRepository.findOne({
      where: [
        { userId: requesterId, friendId: recipientId },
        { userId: recipientId, friendId: requesterId },
      ],
    });

    if (existingFriendship) {
      throw new BadRequestException('Already friends with this user');
    }

    // Check for existing request
    const existingRequest = await this.friendRequestRepository.findOne({
      where: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ],
    });

    if (existingRequest && existingRequest.status === FriendRequestStatus.PENDING) {
      throw new BadRequestException('Friend request already exists');
    }

    // Create new friend request
    const friendRequest = this.friendRequestRepository.create({
      requesterId,
      recipientId,
      status: FriendRequestStatus.PENDING,
    });

    return this.friendRequestRepository.save(friendRequest);
  }

  /**
   * Accept a friend request - creates bidirectional friendship
   */
  async acceptFriendRequest(
    userId: string,
    requestId: string,
  ): Promise<{ friendRequest: FriendRequest; friendship: Friend[] }> {
    const friendRequest = await this.friendRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendRequest.recipientId !== userId) {
      throw new BadRequestException('Only the recipient can accept this request');
    }

    if (friendRequest.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Friend request is not pending');
    }

    // Create bidirectional friendship
    const friend1 = this.friendRepository.create({
      userId: friendRequest.requesterId,
      friendId: friendRequest.recipientId,
    });

    const friend2 = this.friendRepository.create({
      userId: friendRequest.recipientId,
      friendId: friendRequest.requesterId,
    });

    await this.friendRepository.save([friend1, friend2]);

    // Update request status
    friendRequest.status = FriendRequestStatus.ACCEPTED;
    await this.friendRequestRepository.save(friendRequest);

    return { friendRequest, friendship: [friend1, friend2] };
  }

  /**
   * Decline a friend request
   */
  async declineFriendRequest(userId: string, requestId: string): Promise<FriendRequest> {
    const friendRequest = await this.friendRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendRequest.recipientId !== userId) {
      throw new BadRequestException('Only the recipient can decline this request');
    }

    friendRequest.status = FriendRequestStatus.DECLINED;
    return this.friendRequestRepository.save(friendRequest);
  }

  /**
   * Get all pending friend requests for a user
   */
  async getPendingRequests(userId: string): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: {
        recipientId: userId,
        status: FriendRequestStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all friends for a user
   */
  async getFriends(userId: string): Promise<Friend[]> {
    return this.friendRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get specific friend relationship
   */
  async getFriend(userId: string, friendId: string): Promise<Friend> {
    const friend = await this.friendRepository.findOne({
      where: { userId, friendId },
    });

    if (!friend) {
      throw new NotFoundException('Friend not found');
    }

    return friend;
  }

  /**
   * Update friend nickname
   */
  async updateFriendNickname(
    userId: string,
    friendId: string,
    nickname: string,
  ): Promise<Friend> {
    const friend = await this.getFriend(userId, friendId);
    friend.nickname = nickname;
    return this.friendRepository.save(friend);
  }

  /**
   * Block a friend
   */
  async blockFriend(userId: string, friendId: string): Promise<Friend[]> {
    // Block in both directions
    const friend1 = await this.friendRepository.findOne({
      where: { userId, friendId },
    });

    const friend2 = await this.friendRepository.findOne({
      where: { userId: friendId, friendId: userId },
    });

    if (friend1) friend1.isBlocked = true;
    if (friend2) friend2.isBlocked = true;

    const results = [];
    if (friend1) results.push(await this.friendRepository.save(friend1));
    if (friend2) results.push(await this.friendRepository.save(friend2));

    return results;
  }

  /**
   * Unblock a friend
   */
  async unblockFriend(userId: string, friendId: string): Promise<Friend[]> {
    const friend1 = await this.friendRepository.findOne({
      where: { userId, friendId },
    });

    const friend2 = await this.friendRepository.findOne({
      where: { userId: friendId, friendId: userId },
    });

    if (friend1) friend1.isBlocked = false;
    if (friend2) friend2.isBlocked = false;

    const results = [];
    if (friend1) results.push(await this.friendRepository.save(friend1));
    if (friend2) results.push(await this.friendRepository.save(friend2));

    return results;
  }

  /**
   * Remove a friend
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    // Remove bidirectional friendship
    await this.friendRepository.delete({
      userId,
      friendId,
    });

    await this.friendRepository.delete({
      userId: friendId,
      friendId: userId,
    });
  }

  /**
   * Check if two users are friends
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await this.friendRepository.findOne({
      where: { userId: userId1, friendId: userId2 },
    });

    return !!friendship;
  }
}
