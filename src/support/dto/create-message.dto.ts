import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ description: 'Message body text' })
  @IsString()
  @MinLength(1)
  body: string;
}
