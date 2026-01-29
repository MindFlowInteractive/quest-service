import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CreateFriendRequestDto, UpdateFriendRequestDto, AddFriendNicknameDto } from './dto';

// Note: In a real implementation, you would have auth guards here
// This is a simplified version for demonstration

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  /**
   * Send a friend request
   * POST /friends/request/:recipientId
   */
  @Post('request')
  async sendFriendRequest(
    @Body() dto: CreateFriendRequestDto,
    // @CurrentUser() userId: string,
  ) {
    // In real implementation, get userId from JWT token
    const userId = ''; // TODO: Get from auth
    return this.friendsService.sendFriendRequest(userId, dto);
  }

  /**
   * Get pending friend requests
   * GET /friends/requests/pending
   */
  @Get('requests/pending')
  async getPendingRequests() {
    const userId = ''; // TODO: Get from auth
    return this.friendsService.getPendingRequests(userId);
  }

  /**
   * Accept a friend request
   * POST /friends/requests/:requestId/accept
   */
  @Post('requests/:requestId/accept')
  async acceptFriendRequest(@Param('requestId') requestId: string) {
    const userId = ''; // TODO: Get from auth
    return this.friendsService.acceptFriendRequest(userId, requestId);
  }

  /**
   * Decline a friend request
   * POST /friends/requests/:requestId/decline
   */
  @Post('requests/:requestId/decline')
  async declineFriendRequest(@Param('requestId') requestId: string) {
    const userId = ''; // TODO: Get from auth
    return this.friendsService.declineFriendRequest(userId, requestId);
  }

  /**
   * Get all friends
   * GET /friends
   */
  @Get()
  async getFriends() {
    const userId = ''; // TODO: Get from auth
    return this.friendsService.getFriends(userId);
  }

  /**
   * Get specific friend details
   * GET /friends/:friendId
   */
  @Get(':friendId')
  async getFriend(@Param('friendId') friendId: string) {
    const userId = ''; // TODO: Get from auth
    return this.friendsService.getFriend(userId, friendId);
  }

  /**
   * Update friend nickname
   * PATCH /friends/:friendId/nickname
   */
  @Patch(':friendId/nickname')
  async updateFriendNickname(
    @Param('friendId') friendId: string,
    @Body() dto: AddFriendNicknameDto,
  ) {
    const userId = ''; // TODO: Get from auth
    return this.friendsService.updateFriendNickname(userId, friendId, dto.nickname);
  }

  /**
   * Block a friend
   * POST /friends/:friendId/block
   */
  @Post(':friendId/block')
  async blockFriend(@Param('friendId') friendId: string) {
    const userId = ''; // TODO: Get from auth
    return this.friendsService.blockFriend(userId, friendId);
  }

  /**
   * Unblock a friend
   * POST /friends/:friendId/unblock
   */
  @Post(':friendId/unblock')
  async unblockFriend(@Param('friendId') friendId: string) {
    const userId = ''; // TODO: Get from auth
    return this.friendsService.unblockFriend(userId, friendId);
  }

  /**
   * Remove a friend
   * DELETE /friends/:friendId
   */
  @Delete(':friendId')
  async removeFriend(@Param('friendId') friendId: string) {
    const userId = ''; // TODO: Get from auth
    await this.friendsService.removeFriend(userId, friendId);
    return { message: 'Friend removed successfully' };
  }
}
