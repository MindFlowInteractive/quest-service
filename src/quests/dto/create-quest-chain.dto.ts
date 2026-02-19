import { IsString, IsOptional, IsEnum, IsInt, IsDateString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuestChainDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(['active', 'inactive', 'archived'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'archived';

  @ValidateNested()
  @Type(() => QuestChainStoryDto)
  story: QuestChainStoryDto;

  @ValidateNested()
  @Type(() => QuestChainRewardsDto)
  @IsOptional()
  rewards?: QuestChainRewardsDto;

  @IsDateString()
  @IsOptional()
  startsAt?: Date;

  @IsDateString()
  @IsOptional()
  endsAt?: Date;
}

export class QuestChainStoryDto {
  @IsString()
  intro: string;

  @IsString()
  outro: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoryChapterDto)
  chapters: StoryChapterDto[];
}

export class StoryChapterDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  storyText: string;
}

export class QuestChainRewardsDto {
  @ValidateNested()
  @Type(() => CompletionRewardsDto)
  completion: CompletionRewardsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneRewardDto)
  @IsOptional()
  milestones?: MilestoneRewardDto[];
}

export class CompletionRewardsDto {
  @IsInt()
  xp: number;

  @IsInt()
  coins: number;

  @IsArray()
  @IsString({ each: true })
  items: string[];
}

export class MilestoneRewardDto {
  @IsInt()
  puzzleIndex: number;

  @ValidateNested()
  @Type(() => RewardDetailsDto)
  rewards: RewardDetailsDto;
}

export class RewardDetailsDto {
  @IsInt()
  xp: number;

  @IsInt()
  coins: number;

  @IsArray()
  @IsString({ each: true })
  items: string[];
}