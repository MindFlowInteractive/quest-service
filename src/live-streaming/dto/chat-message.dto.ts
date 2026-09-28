import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ description: 'Message body shown to spectators' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content: string;
}
