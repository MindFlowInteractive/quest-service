import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class EvaluateSegmentDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  userId?: string;

  @IsOptional()
  @IsArray()
  userIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number;
}

export class MembershipChangeDto {
  @IsString()
  @Length(1, 120)
  userId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class OverlapQueryDto {
  @IsArray()
  @IsString({ each: true })
  @Length(1, 60, { each: true })
  segmentIds: string[];
}

export class CheckMembershipDto {
  @IsString()
  @Length(1, 120)
  userId: string;
}
