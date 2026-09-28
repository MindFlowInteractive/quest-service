import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModerationActionType } from '../entities/stream-moderation-action.entity';

/**
 * One moderator action. `targetUserId` is required for ban/unban/timeout;
 * `messageId` is required for delete/pin. The service validates the pairing so a
 * malformed action fails before anything is written.
 */
export class ModerateStreamDto {
  @ApiProperty({ enum: ModerationActionType })
  @IsEnum(ModerationActionType)
  action: ModerationActionType;

  @ApiPropertyOptional({ description: 'Subject of a ban, unban or timeout' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  targetUserId?: string;

  @ApiPropertyOptional({ description: 'Reason recorded on the action' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  reason?: string;

  @ApiPropertyOptional({ description: 'Message a delete/pin targets' })
  @IsUUID()
  @IsOptional()
  messageId?: string;

  @ApiPropertyOptional({
    description: 'Timeout length in minutes (timeout only)',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;
}
