import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class IngestUserEventDto {
  @IsString()
  @Length(1, 120)
  userId: string;

  /**
   * Logical action name (`level_up`, `purchase`, `login`, `streak_extended`,
   * etc.). Required for behavioural segmentation.
   */
  @IsOptional()
  @IsString()
  @Length(1, 80)
  action?: string;

  /**
   * Arbitrary attributes merged into the user's signal record. Demographic,
   * behavioural, or custom attributes all flow through this channel.
   */
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsOptional()
  segmentsToReEvaluate?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  increment?: number;
}

export class BatchIngestUserEventsDto {
  @IsArray()
  events: IngestUserEventDto[];
}
