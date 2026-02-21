import { IsEnum, IsBoolean, IsString, IsOptional } from 'class-validator';
import { ConsentType } from '../entities/consent-log.entity';

export class ConsentUpdateDto {
  @IsEnum(ConsentType)
  consentType: ConsentType;

  @IsBoolean()
  granted: boolean;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
