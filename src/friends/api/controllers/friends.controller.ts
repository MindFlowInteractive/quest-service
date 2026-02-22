import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { FriendRequestService } from '../../application/services/friend-request.service';
import { FriendshipService } from '../../application/services/friendship.service';
import { ActivityFeedService } from '../../application/services/activity-feed.service';
import { PrivacyService } from '../../application/services/privacy.service';
import { RecommendationService } from '../../application/services/recommendation.service';
import {
  SendFriendRequestDto,
  AcceptFriendRequestDto,
  RejectFriendRequestDto,
  RemoveFriendDto,
  ListFriendsQueryDto,
  ListFriendRequestsQueryDto,
  GetActivityFeedQueryDto,
  GetFriendLeaderboardQueryDto,
  SearchUsersQueryDto,
  UpdatePrivacySettingsDto,
  GetRecommendationsQueryDto,
  FriendRequestResponseDto,
  FriendshipResponseDto,
  FriendListResponseDto,
  FriendRequestListResponseDto,
  ActivityFeedResponseDto,
  FriendLeaderboardResponseDto,
  UserSearchResponseDto,
  PrivacySettingsResponseDto,
  RecommendationsResponseDto,
  SendFriendRequestResponseDto,
  AcceptFriendRequestResponseDto,
  GenericSuccessResponseDto,
  CreateActivityEventDto,
  CreateActivityEventResponseDto,
} from '../dtos/friend.dto';
import {
  FriendRequestNotFoundException,
  FriendshipNotFoundException,
  SelfFriendRequestException,
  UserBlockedException,
  FriendshipAlreadyExistsException,
  RateLimitExceededException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/domain-exceptions';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { IUserService, ILeaderboardService } from '../../domain/repositories/repository-interfaces';

/**
 * Friends Controller
 * Exposes REST endpoints for the friend system
 */
@Controller('api/v1/friends')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class FriendsController {
  constructor(
    private friendRequestService: FriendRequestService,
    private friendshipService: FriendshipService,
    private activityFeedService: ActivityFeedService,
    private privacyService: PrivacyService,
    private recommendationService: RecommendationService,
    @Inject('IUserService')
    private userService: IUserService,
    @Inject('ILeaderboardService')
    private leaderboardService: ILeaderboardService,
  ) {}

  /**
   * POST /api/v1/friends/requests
   * Send a friend request
   */
  @Post('requests')
  @HttpCode(201)
  async sendFriendRequest(
    @Req() req: Request,
    @Body() dto: SendFriendRequestDto,
  ): Promise<SendFriendRequestResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    try {
      const request = await this.friendRequestService.sendFriendRequest(
        userId,
        dto.toUserId,
        dto.message,
      );

      return {
        id: request.id,
        state: request.state,
        createdAt: request.createdAt,
      };
    } catch (error) {
      if (error instanceof SelfFriendRequestException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof FriendshipAlreadyExistsException) {
        throw new ConflictException(error.message);
      }
      if (error instanceof UserBlockedException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof RateLimitExceededException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * POST /api/v1/friends/requests/:requestId/accept
   * Accept a friend request
   */
  @Post('requests/:requestId/accept')
  @HttpCode(200)
  async acceptFriendRequest(
    @Req() req: Request,
    @Param('requestId') requestId: string,
    @Body() _dto: AcceptFriendRequestDto,
  ): Promise<AcceptFriendRequestResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    try {
      const result = await this.friendRequestService.acceptFriendRequest(
        requestId,
        userId,
      );

      const friendUser = await this.userService.getUserById(result.friendId);

      return {
        friendshipCreated: result.friendshipCreated,
        friendId: result.friendId,
        displayName: friendUser?.displayName || 'Unknown',
      };
    } catch (error) {
      if (error instanceof FriendRequestNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof UnauthorizedAccessException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * POST /api/v1/friends/requests/:requestId/reject
   * Reject a friend request
   */
  @Post('requests/:requestId/reject')
  @HttpCode(200)
  async rejectFriendRequest(
    @Req() req: Request,
    @Param('requestId') requestId: string,
    @Body() dto: RejectFriendRequestDto,
  ): Promise<GenericSuccessResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    try {
      await this.friendRequestService.rejectFriendRequest(requestId, userId);
      return { success: true, message: 'Friend request rejected' };
    } catch (error) {
      if (error instanceof FriendRequestNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * DELETE /api/v1/friends/requests/:requestId
   * Cancel outgoing friend request
   */
  @Delete('requests/:requestId')
  @HttpCode(204)
  async cancelFriendRequest(
    @Req() req: Request,
    @Param('requestId') requestId: string,
  ): Promise<void> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    try {
      await this.friendRequestService.cancelFriendRequest(requestId, userId);
    } catch (error) {
      if (error instanceof FriendRequestNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/friends
   * List friends of the user
   */
  @Get()
  async listFriends(
    @Req() req: Request,
    @Query() query: ListFriendsQueryDto,
  ): Promise<FriendListResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    const limit = query.limit || 50;
    const offset = 0; // In production, decode cursor for offset

    const friendships = await this.friendshipService.getFriends(
      userId,
      limit + 1,
      offset,
    );

    const items: FriendshipResponseDto[] = [];
    for (let i = 0; i < Math.min(friendships.length, limit); i++) {
      const friendship = friendships[i];
      const user = await this.userService.getUserById(friendship.friendId.value);

      if (user && (await this.privacyService.isProfileVisible(friendship.friendId.value, userId))) {
        items.push({
          id: friendship.id,
          userId: friendship.friendId.value,
          friendId: friendship.userId.value,
          displayName: user.displayName,
          avatar: user.avatar,
          since: friendship.createdAt,
        });
      }
    }

    return {
      items,
      nextCursor: friendships.length > limit ? Buffer.from(JSON.stringify({ offset: offset + limit })).toString('base64') : null,
      hasMore: friendships.length > limit,
    };
  }

  /**
   * DELETE /api/v1/friends/:friendId
   * Remove a friend
   */
  @Delete(':friendId')
  @HttpCode(204)
  async removeFriend(
    @Req() req: Request,
    @Param('friendId') friendId: string,
    @Body() _dto: RemoveFriendDto,
  ): Promise<void> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    try {
      await this.friendshipService.removeFriend(userId, friendId);
    } catch (error) {
      if (error instanceof FriendshipNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/friends/requests
   * Get friend requests (inbound/outbound)
   */
  @Get('requests')
  async listFriendRequests(
    @Req() req: Request,
    @Query() query: ListFriendRequestsQueryDto,
  ): Promise<FriendRequestListResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    const limit = query.limit || 50;
    const offset = 0;
    const filter = query.filter || 'inbound';

    let requests: any[] = [];

    if (filter === 'inbound' || filter === 'all') {
      const inbound = await this.friendRequestService.getInboundRequests(userId, limit, offset);
      requests = requests.concat(inbound);
    }

    if (filter === 'outbound' || filter === 'all') {
      const outbound = await this.friendRequestService.getOutboundRequests(userId, limit, offset);
      requests = requests.concat(outbound);
    }

    const items: FriendRequestResponseDto[] = requests.map((r) => ({
      id: r.id,
      fromUserId: r.fromUserId.value,
      toUserId: r.toUserId.value,
      state: r.state,
      message: r.message,
      createdAt: r.createdAt,
      respondedAt: r.respondedAt,
      expiresAt: r.expiresAt,
    }));

    return {
      items,
      nextCursor: requests.length > limit ? Buffer.from(JSON.stringify({ offset: offset + limit })).toString('base64') : null,
      hasMore: requests.length > limit,
    };
  }

  /**
   * GET /api/v1/friends/feed
   * Get friend activity feed
   */
  @Get('feed')
  async getActivityFeed(
    @Req() req: Request,
    @Query() query: GetActivityFeedQueryDto,
  ): Promise<ActivityFeedResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    const limit = query.limit || 50;
    const cursor = query.cursor;

    const result = await this.activityFeedService.getActivityFeed(userId, limit, cursor);

    const events = result.events.map((e) => ({
      id: e.id,
      actorUserId: e.actorUserId.value,
      actorDisplayName: '', // Would fetch from user service
      eventType: e.eventType,
      payload: e.payload,
      visibility: e.visibility,
      createdAt: e.createdAt,
    }));

    return {
      events,
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
    };
  }

  /**
   * GET /api/v1/friends/leaderboard
   * Get friend-only leaderboard
   */
  @Get('leaderboard')
  async getFriendLeaderboard(
    @Req() req: Request,
    @Query() query: GetFriendLeaderboardQueryDto,
  ): Promise<FriendLeaderboardResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    const limit = query.limit || 50;
    const cursor = query.cursor;
    const metric = query.metric || 'elo';

    // Get top global scores
    const topScores = await this.leaderboardService.getTopScores(metric, limit * 2);

    // Get user's friends
    const friendships = await this.friendshipService.getFriends(userId, 10000);
    const friendIds = new Set(friendships.map((f) => f.friendId.value));

    // Filter to only friends
    const entries = topScores
      .filter((score) => friendIds.has(score.userId))
      .slice(0, limit)
      .map((score) => ({
        rank: score.rank,
        userId: score.userId,
        displayName: '', // Would fetch from user service
        score: score.score,
        isFriend: true,
      }));

    return {
      metric,
      entries,
      nextCursor: entries.length >= limit ? Buffer.from(JSON.stringify({ offset: limit })).toString('base64') : null,
      hasMore: entries.length >= limit,
    };
  }

  /**
   * GET /api/v1/friends/search
   * Search for users
   */
  @Get('search')
  async searchUsers(
    @Req() req: Request,
    @Query() query: SearchUsersQueryDto,
  ): Promise<UserSearchResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    const limit = query.limit || 20;
    const users = await this.userService.searchUsers(query.q, limit + 1);

    // Get friendship status for each user
    const friendshipStatus = await this.friendshipService.checkFriendshipsBatch(
      userId,
      users.map((u) => u.id),
    );

    const results = users
      .filter((u) => u.id !== userId)
      .slice(0, limit)
      .map((u) => ({
        userId: u.id,
        displayName: u.displayName,
        avatar: u.avatar,
        friendshipStatus: (friendshipStatus.get(u.id) ? 'friend' : 'none') as 'friend' | 'pending_sent' | 'pending_received' | 'none',
        mutualFriendsCount: 0, // Would compute from friend graph
      }));

    return {
      results,
      nextCursor: users.length > limit ? Buffer.from(JSON.stringify({ cursor: limit })).toString('base64') : null,
      hasMore: users.length > limit,
    };
  }

  /**
   * GET /api/v1/friends/privacy
   * Get privacy settings
   */
  @Get('privacy')
  async getPrivacySettings(@Req() req: Request): Promise<PrivacySettingsResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    const settings = await this.privacyService.getPrivacySettings(userId);

    return {
      userId: settings.userId.value,
      profileVisibility: settings.profileVisibility,
      showActivityTo: settings.showActivityTo,
      leaderboardVisibility: settings.leaderboardVisibility,
      updatedAt: settings.updatedAt,
    };
  }

  /**
   * PUT /api/v1/friends/privacy
   * Update privacy settings
   */
  @Post('privacy')
  async updatePrivacySettings(
    @Req() req: Request,
    @Body() dto: UpdatePrivacySettingsDto,
  ): Promise<PrivacySettingsResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    const settings = await this.privacyService.updatePrivacySettings(userId, dto);

    return {
      userId: settings.userId.value,
      profileVisibility: settings.profileVisibility,
      showActivityTo: settings.showActivityTo,
      leaderboardVisibility: settings.leaderboardVisibility,
      updatedAt: settings.updatedAt,
    };
  }

  /**
   * GET /api/v1/friends/recommendations
   * Get friend recommendations
   */
  @Get('recommendations')
  async getRecommendations(
    @Req() req: Request,
    @Query() query: GetRecommendationsQueryDto,
  ): Promise<RecommendationsResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    const limit = query.limit || 10;
    const recommendations = await this.recommendationService.generateRecommendations(
      userId,
      limit,
    );

    return {
      recommendations: recommendations.map((r) => ({
        userId: r.userId,
        displayName: r.displayName,
        avatar: r.avatar,
        mutualFriendsCount: r.mutualFriendsCount,
        sharedInterestsCount: r.sharedInterestsCount,
        recommendationScore: r.recommendationScore,
        reason: r.reason,
      })),
      nextCursor: null,
      hasMore: false,
    };
  }

  /**
   * POST /api/v1/friends/activity
   * Record an activity event for the current user
   */
  @Post('activity')
  @HttpCode(201)
  async recordActivity(
    @Req() req: Request,
    @Body() dto: CreateActivityEventDto,
  ): Promise<CreateActivityEventResponseDto> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new UnauthorizedAccessException();
    }

    const event = await this.activityFeedService.recordActivity(
      userId,
      dto.eventType as any,
      dto.payload,
      dto.visibility,
    );

    return {
      id: event.id,
      actorUserId: event.actorUserId.value,
      eventType: event.eventType,
      createdAt: event.createdAt,
    };
  }
}
