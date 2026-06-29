import { IsString, IsArray, ValidateNested } from 'class-validator';

class QuestChainEntryDto {
  @IsString()
  puzzleId: string;

  @IsString()
  unlockCondition: string;

  @IsArray()
  nextEntries: string[];
}

export class CreateQuestChainDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @ValidateNested({ each: true })
  entries: QuestChainEntryDto[];
}
