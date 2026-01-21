import { IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';
import { FriendRequestStatus } from '../friend-request.entity';

export class CreateFriendRequestDto {
  @IsUUID()
  recipientId: string;
}

export class UpdateFriendRequestDto {
  @IsEnum(FriendRequestStatus)
  status: FriendRequestStatus;
}

export class AddFriendNicknameDto {
  @IsOptional()
  @IsString()
  nickname?: string;
}

export class FriendResponseDto {
  id: string;
  userId: string;
  friendId: string;
  nickname: string;
  isBlocked: boolean;
  createdAt: Date;
}

export class FriendRequestResponseDto {
  id: string;
  requesterId: string;
  recipientId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}
