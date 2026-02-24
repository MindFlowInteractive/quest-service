import { IsUUID, IsInt, IsOptional, IsBoolean, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class UnlockConditionsDto {
  @IsUUID(undefined, { each: true })
  previousPuzzles: string[];

  @IsInt()
  @IsOptional()
  minimumScore?: number;

  @IsInt()
  @IsOptional()
  timeLimit?: number;

  @IsBoolean()
  @IsOptional()
  noHints?: boolean;
}

class CheckpointRewardsDto {
  @IsInt()
  xp: number;

  @IsInt()
  coins: number;

  @IsString({ each: true })
  items: string[];
}

export class AddPuzzleToChainDto {
  @IsUUID()
  puzzleId: string;

  @IsInt()
  sequenceOrder: number;

  @ValidateNested()
  @Type(() => UnlockConditionsDto)
  @IsOptional()
  unlockConditions?: UnlockConditionsDto;

  @IsBoolean()
  @IsOptional()
  isCheckpoint?: boolean;

  @ValidateNested()
  @Type(() => CheckpointRewardsDto)
  @IsOptional()
  checkpointRewards?: CheckpointRewardsDto;
}