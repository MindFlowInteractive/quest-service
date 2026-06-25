import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import {
  RuleCategory,
  RuleCombinator,
  RuleOperator,
} from '../interfaces/user-signal.interface';

export class CreateRuleDto {
  @IsString()
  @Length(1, 120)
  field: string;

  @IsEnum(RuleOperator)
  operator: RuleOperator;

  @IsOptional()
  value?: unknown;

  @IsOptional()
  @IsEnum(RuleCategory)
  category?: RuleCategory;

  @IsOptional()
  @IsEnum(RuleCombinator)
  combinator?: RuleCombinator;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
