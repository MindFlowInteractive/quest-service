import { IsString, IsNotEmpty, IsDate, IsOptional, IsBoolean, IsObject, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  theme?: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsObject()
  @IsOptional()
  bannerImage?: {
    url: string;
    alt: string;
  };

  @IsObject()
  @IsOptional()
  metadata?: {
    maxParticipants?: number;
    minLevel?: number;
    eventType?: 'competitive' | 'casual' | 'special';
    rules?: string[];
  };
}
