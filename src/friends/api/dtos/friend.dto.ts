import {
  IsString,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { PrivacyLevel } from '../../domain/entities/domain-entities';

/**
 * ============================================================
 * REQUEST DTOs
 * ============================================================
 */

export class SendFriendRequestDto {
  @IsUUID()
  toUserId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class AcceptFriendRequestDto {
  // Path param only
}

export class RejectFriendRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CancelFriendRequestDto {
  // Path param only
}

export class RemoveFriendDto {
  // Path param only
}

export class ListFriendsQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ListFriendRequestsQueryDto {
  @IsOptional()
  @IsEnum(['inbound', 'outbound', 'all'])
  filter?: 'inbound' | 'outbound' | 'all' = 'inbound';

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class GetActivityFeedQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class GetFriendLeaderboardQueryDto {
  @IsString()
  metric: string; // 'elo', 'victories', 'score', etc.

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class SearchUsersQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;
}

export class UpdatePrivacySettingsDto {
  @IsOptional()
  @IsEnum(['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'])
  profileVisibility?: PrivacyLevel;

  @IsOptional()
  @IsEnum(['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'])
  showActivityTo?: PrivacyLevel;

  @IsOptional()
  @IsEnum(['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'])
  leaderboardVisibility?: PrivacyLevel;
}

export class GetRecommendationsQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  cursor?: string;
}

/**
 * ============================================================
 * RESPONSE DTOs
 * ============================================================
 */

export class FriendRequestResponseDto {
  id: string;
  fromUserId: string;
  toUserId: string;
  state: string;
  message: string | null;
  createdAt: Date;
  respondedAt: Date | null;
  expiresAt: Date | null;
}

export class FriendshipResponseDto {
  id: string;
  userId: string;
  friendId: string;
  displayName: string;
  avatar?: string;
  since: Date;
}

export class FriendListResponseDto {
  items: FriendshipResponseDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class FriendRequestListResponseDto {
  items: FriendRequestResponseDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class ActivityEventResponseDto {
  id: string;
  actorUserId: string;
  actorDisplayName: string;
  eventType: string;
  payload: Record<string, any>;
  visibility: string;
  createdAt: Date;
}

export class ActivityFeedResponseDto {
  events: ActivityEventResponseDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class LeaderboardEntryResponseDto {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  isFriend: boolean;
}

export class FriendLeaderboardResponseDto {
  metric: string;
  entries: LeaderboardEntryResponseDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class UserSearchResultDto {
  userId: string;
  displayName: string;
  avatar?: string;
  friendshipStatus: 'friend' | 'pending_sent' | 'pending_received' | 'none';
  mutualFriendsCount: number;
}

export class UserSearchResponseDto {
  results: UserSearchResultDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class PrivacySettingsResponseDto {
  userId: string;
  profileVisibility: PrivacyLevel;
  showActivityTo: PrivacyLevel;
  leaderboardVisibility: PrivacyLevel;
  updatedAt: Date;
}

export class RecommendationDto {
  userId: string;
  displayName: string;
  avatar?: string;
  mutualFriendsCount: number;
  sharedInterestsCount: number;
  recommendationScore: number;
  reason: string; // 'mutual_friends', 'shared_interests', 'skill_proximity', 'interaction_history'
}

export class RecommendationsResponseDto {
  recommendations: RecommendationDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class SendFriendRequestResponseDto {
  id: string;
  state: string;
  createdAt: Date;
}

export class AcceptFriendRequestResponseDto {
  friendshipCreated: boolean;
  friendId: string;
  displayName: string;
}

export class CreateActivityEventDto {
  eventType: string;
  payload: Record<string, any>;
  visibility?: PrivacyLevel;
}

export class CreateActivityEventResponseDto {
  id: string;
  actorUserId: string;
  eventType: string;
  createdAt: Date;
}

export class FriendStatsDto {
  totalFriends: number;
  pendingRequestsSent: number;
  pendingRequestsReceived: number;
  blockedUsers: number;
}

export class GenericSuccessResponseDto {
  success: boolean;
  message: string;
}
