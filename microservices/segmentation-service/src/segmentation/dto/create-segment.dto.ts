import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  RuleCategory,
  RuleCombinator,
  RuleOperator,
  SegmentStatus,
  SegmentationType,
} from '../interfaces/user-signal.interface';
import { CreateRuleDto } from './create-rule.dto';

export class CreateSegmentDto {
  @IsString()
  @Length(3, 60)
  @Matches(/^[a-z0-9][a-z0-9-_]*$/, {
    message:
      'slug must be lowercase alphanumeric with optional - or _, starting with alphanumeric',
  })
  slug: string;

  @IsString()
  @Length(3, 200)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsEnum(SegmentationType)
  type?: SegmentationType;

  @IsOptional()
  @IsEnum(SegmentStatus)
  status?: SegmentStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  evaluationIntervalSeconds?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateRuleDto)
  rules?: CreateRuleDto[];

  // Re-export nested DTO field constraints on the rule shape.
  // (kept here for handler convenience / swagger)
  static ruleConstraints = {
    field: { maxLength: 120 },
    operator: RuleOperator,
    category: RuleCategory,
    combinator: RuleCombinator,
  };
}
