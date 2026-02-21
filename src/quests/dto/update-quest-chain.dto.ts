import { IsString, IsOptional, IsEnum, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CompletionRewardsDto {
  @IsInt()
  xp: number;

  @IsInt()
  coins: number;

  @IsString({ each: true })
  items: string[];
}

class QuestChainStoryDto {
  @IsString()
  intro: string;

  @IsString()
  outro: string;
}

class QuestChainRewardsDto {
  @ValidateNested()
  @Type(() => CompletionRewardsDto)
  completion: CompletionRewardsDto;
}

export class UpdateQuestChainDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['active', 'inactive', 'archived'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'archived';

  @ValidateNested()
  @Type(() => QuestChainStoryDto)
  @IsOptional()
  story?: QuestChainStoryDto;

  @ValidateNested()
  @Type(() => QuestChainRewardsDto)
  @IsOptional()
  rewards?: QuestChainRewardsDto;
}