import { IsEnum, IsNotEmpty } from 'class-validator';

export enum VoteType {
  HELPFUL = 'helpful',
  UNHELPFUL = 'unhelpful',
}

export class VoteReviewDto {
  @IsEnum(VoteType)
  @IsNotEmpty()
  voteType: VoteType;
}
