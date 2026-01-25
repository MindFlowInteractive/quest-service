import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, IsObject, Min } from 'class-validator';

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  type: 'points' | 'badge' | 'item' | 'currency' | 'title' | 'avatar' | 'nft';

  @IsInt()
  @Min(0)
  requiredScore: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  requiredPuzzles?: number;

  @IsObject()
  @IsNotEmpty()
  rewardData: {
    value?: number;
    imageUrl?: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    metadata?: Record<string, any>;
  };

  @IsInt()
  @Min(0)
  @IsOptional()
  maxClaims?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
