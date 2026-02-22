import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { FriendRequest, FriendRequestState, UserId, Friendship } from '../../domain/entities/domain-entities';
import {
  FriendRequestAlreadyExistsException,
  FriendRequestNotFoundException,
  FriendshipAlreadyExistsException,
  SelfFriendRequestException,
  UserBlockedException,
  UnauthorizedAccessException,
  RateLimitExceededException,
} from '../../domain/exceptions/domain-exceptions';
import {
  IFriendRequestRepository,
  IFriendshipRepository,
  IBlockRepository,
  ICacheService,
  IEventPublisher,
  IUserService,
} from '../../domain/repositories/repository-interfaces';
import {
  FriendRequestSentEvent,
  FriendRequestAcceptedEvent,
  FriendRemovedEvent,
} from '../../domain/entities/domain-event';

@Injectable()
export class FriendRequestService {
  constructor(
    @Inject('IFriendRequestRepository')
    private friendRequestRepo: IFriendRequestRepository,
    @Inject('IFriendshipRepository')
    private friendshipRepo: IFriendshipRepository,
    @Inject('IBlockRepository')
    private blockRepo: IBlockRepository,
    @Inject('ICacheService')
    private cacheService: ICacheService,
    @Inject('IEventPublisher')
    private eventPublisher: IEventPublisher,
    @Inject('IUserService')
    private userService: IUserService,
  ) {}

  /**
   * Send a friend request from one user to another.
   * Handles duplicate prevention, cross-requests, and rate limiting.
   */
  async sendFriendRequest(
    fromUserId: string,
    toUserId: string,
    message?: string,
    correlationId: string = uuidv4(),
  ): Promise<FriendRequest> {
    // Validation checks
    if (fromUserId === toUserId) {
      throw new SelfFriendRequestException(fromUserId);
    }

    // Check if users exist
    const [fromUserExists, toUserExists] = await Promise.all([
      this.userService.checkUserExists(fromUserId),
      this.userService.checkUserExists(toUserId),
    ]);

    if (!fromUserExists || !toUserExists) {
      throw new Error('One or both users do not exist');
    }

    // Check if sender is blocked
    const isBlocked = await this.blockRepo.isBlocked(fromUserId, toUserId);
    if (isBlocked) {
      throw new UserBlockedException(fromUserId, toUserId);
    }

    // Check rate limiting (max 10 pending requests per hour)
    const outboundRequests = await this.friendRequestRepo.findOutboundByUserId(
      fromUserId,
      100,
    );
    const pendingCount = outboundRequests.filter(
      (r) => r.state === FriendRequestState.PENDING,
    ).length;
    if (pendingCount >= 10) {
      throw new RateLimitExceededException(
        'Too many pending friend requests sent',
      );
    }

    // Check if already friends
    const alreadyFriends = await this.friendshipRepo.isFriend(
      fromUserId,
      toUserId,
    );
    if (alreadyFriends) {
      throw new FriendshipAlreadyExistsException(fromUserId, toUserId);
    }

    // Check for existing pending request (both directions)
    const existingRequest = await this.friendRequestRepo.findByUsersPair(
      fromUserId,
      toUserId,
    );
    if (existingRequest && existingRequest.state === FriendRequestState.PENDING) {
      throw new FriendRequestAlreadyExistsException(fromUserId, toUserId);
    }

    // Check for cross request (if toUser has sent pending request to fromUser)
    const crossRequest = await this.friendRequestRepo.findByUsersPair(
      toUserId,
      fromUserId,
    );

    const requestId = uuidv4();
    const idempotencyKey = `friend_request_sent_${fromUserId}_${toUserId}_${Date.now()}`;

    // If cross request exists and is pending, auto-accept both
    if (crossRequest && crossRequest.state === FriendRequestState.PENDING) {
      return this.acceptCrossRequest(
        crossRequest,
        fromUserId,
        toUserId,
        correlationId,
      );
    }

    // Create new friend request
    const friendRequest = new FriendRequest({
      id: requestId,
      fromUserId: new UserId(fromUserId),
      toUserId: new UserId(toUserId),
      state: FriendRequestState.PENDING,
      message: message || null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // Save to repository
    await this.friendRequestRepo.save(friendRequest);

    // Publish domain event
    const event = new FriendRequestSentEvent(
      fromUserId,
      toUserId,
      message || null,
      {
        eventId: uuidv4(),
        correlationId,
        idempotencyKey,
      },
    );

    await this.eventPublisher.publishEvent(event);

    // Invalidate cache
    await this.cacheService.del(`friend_requests:inbound:${toUserId}`);

    return friendRequest;
  }

  /**
   * Accept a friend request.
   * Creates mutual friendship.
   */
  async acceptFriendRequest(
    requestId: string,
    acceptingUserId: string,
    correlationId: string = uuidv4(),
  ): Promise<{ friendshipCreated: boolean; friendId: string }> {
    const friendRequest = await this.friendRequestRepo.findById(requestId);

    if (!friendRequest) {
      throw new FriendRequestNotFoundException(requestId);
    }

    // Verify user is recipient
    if (friendRequest.toUserId.value !== acceptingUserId) {
      throw new UnauthorizedAccessException('User is not the recipient');
    }

    if (!friendRequest.canAccept()) {
      throw new Error(
        `Cannot accept friend request in state: ${friendRequest.state}`,
      );
    }

    // Accept request
    friendRequest.accept();

    // Create mutual friendships
    const friendship1 = new Friendship({
      id: uuidv4(),
      userId: new UserId(friendRequest.fromUserId.value),
      friendId: new UserId(friendRequest.toUserId.value),
    });

    const friendship2 = new Friendship({
      id: uuidv4(),
      userId: new UserId(friendRequest.toUserId.value),
      friendId: new UserId(friendRequest.fromUserId.value),
    });

    // Save atomically
    await this.friendshipRepo.saveBatch([friendship1, friendship2]);
    await this.friendRequestRepo.save(friendRequest);

    // Publish domain event
    const idempotencyKey = `friend_request_accepted_${requestId}_${Date.now()}`;
    const event = new FriendRequestAcceptedEvent(
      friendRequest.fromUserId.value,
      friendRequest.toUserId.value,
      {
        eventId: uuidv4(),
        correlationId,
        idempotencyKey,
      },
    );

    await this.eventPublisher.publishEvent(event);

    // Invalidate caches
    await Promise.all([
      this.cacheService.del(`friendships:${friendRequest.fromUserId.value}`),
      this.cacheService.del(`friendships:${friendRequest.toUserId.value}`),
      this.cacheService.del(`friend_requests:inbound:${acceptingUserId}`),
      this.cacheService.del(`friend_requests:outbound:${friendRequest.fromUserId.value}`),
    ]);

    return {
      friendshipCreated: true,
      friendId: friendRequest.fromUserId.value,
    };
  }

  /**
   * Reject a friend request.
   */
  async rejectFriendRequest(
    requestId: string,
    rejectingUserId: string,
    correlationId: string = uuidv4(),
  ): Promise<void> {
    const friendRequest = await this.friendRequestRepo.findById(requestId);

    if (!friendRequest) {
      throw new FriendRequestNotFoundException(requestId);
    }

    if (friendRequest.toUserId.value !== rejectingUserId) {
      throw new UnauthorizedAccessException('User is not the recipient');
    }

    if (!friendRequest.canReject()) {
      throw new Error(
        `Cannot reject friend request in state: ${friendRequest.state}`,
      );
    }

    friendRequest.reject();
    await this.friendRequestRepo.save(friendRequest);

    // Invalidate cache
    await this.cacheService.del(`friend_requests:inbound:${rejectingUserId}`);
  }

  /**
   * Cancel a friend request (only by sender).
   */
  async cancelFriendRequest(
    requestId: string,
    cancelingUserId: string,
    correlationId: string = uuidv4(),
  ): Promise<void> {
    const friendRequest = await this.friendRequestRepo.findById(requestId);

    if (!friendRequest) {
      throw new FriendRequestNotFoundException(requestId);
    }

    if (friendRequest.fromUserId.value !== cancelingUserId) {
      throw new UnauthorizedAccessException('User is not the sender');
    }

    friendRequest.cancel();
    await this.friendRequestRepo.save(friendRequest);

    // Invalidate caches
    await Promise.all([
      this.cacheService.del(`friend_requests:outbound:${cancelingUserId}`),
      this.cacheService.del(`friend_requests:inbound:${friendRequest.toUserId.value}`),
    ]);
  }

  /**
   * Get inbound friend requests for a user.
   */
  async getInboundRequests(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<FriendRequest[]> {
    const cacheKey = `friend_requests:inbound:${userId}`;
    const cached = await this.cacheService.get<FriendRequest[]>(cacheKey);

    if (cached) {
      return cached.slice(offset, offset + limit);
    }

    const requests = await this.friendRequestRepo.findInboundByUserId(userId, 100);
    await this.cacheService.set(cacheKey, requests, 300); // 5 minutes TTL

    return requests.slice(offset, offset + limit);
  }

  /**
   * Get outbound friend requests for a user.
   */
  async getOutboundRequests(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<FriendRequest[]> {
    const cacheKey = `friend_requests:outbound:${userId}`;
    const cached = await this.cacheService.get<FriendRequest[]>(cacheKey);

    if (cached) {
      return cached.slice(offset, offset + limit);
    }

    const requests = await this.friendRequestRepo.findOutboundByUserId(userId, 100);
    await this.cacheService.set(cacheKey, requests, 300);

    return requests.slice(offset, offset + limit);
  }

  /**
   * Handle cross-request auto-acceptance.
   */
  private async acceptCrossRequest(
    crossRequest: FriendRequest,
    fromUserId: string,
    toUserId: string,
    correlationId: string,
  ): Promise<FriendRequest> {
    // Create new request for current user
    const requestId = uuidv4();
    const friendRequest = new FriendRequest({
      id: requestId,
      fromUserId: new UserId(fromUserId),
      toUserId: new UserId(toUserId),
      state: FriendRequestState.ACCEPTED,
    });

    // Accept cross request
    crossRequest.accept();

    // Create mutual friendships
    const friendship1 = new Friendship({
      id: uuidv4(),
      userId: new UserId(fromUserId),
      friendId: new UserId(toUserId),
    });

    const friendship2 = new Friendship({
      id: uuidv4(),
      userId: new UserId(toUserId),
      friendId: new UserId(fromUserId),
    });

    // Save everything atomically
    await this.friendshipRepo.saveBatch([friendship1, friendship2]);
    await this.friendRequestRepo.save(crossRequest);
    await this.friendRequestRepo.save(friendRequest);

    // Publish events
    const idempotencyKey = `cross_request_accepted_${fromUserId}_${toUserId}_${Date.now()}`;
    const event = new FriendRequestAcceptedEvent(fromUserId, toUserId, {
      eventId: uuidv4(),
      correlationId,
      idempotencyKey,
    });

    await this.eventPublisher.publishEvent(event);

    // Invalidate caches
    await Promise.all([
      this.cacheService.del(`friendships:${fromUserId}`),
      this.cacheService.del(`friendships:${toUserId}`),
      this.cacheService.del(`friend_requests:inbound:${toUserId}`),
      this.cacheService.del(`friend_requests:outbound:${fromUserId}`),
    ]);

    return friendRequest;
  }

  /**
   * Get friend request by ID.
   */
  async getFriendRequest(requestId: string): Promise<FriendRequest | null> {
    return this.friendRequestRepo.findById(requestId);
  }
}
