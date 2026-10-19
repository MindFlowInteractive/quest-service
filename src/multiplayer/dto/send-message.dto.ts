import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export const SESSION_MESSAGE_TYPES = ['chat', 'system'];

export class SendMessageDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  @Length(1, 1000)
  content: string;

  @IsOptional()
  @IsIn(SESSION_MESSAGE_TYPES)
  type?: string;
}

/**
 * REST variant: the session id comes from the URL path.
 */
export class SendMessageBodyDto {
  @IsString()
  @Length(1, 1000)
  content: string;

  @IsOptional()
  @IsIn(SESSION_MESSAGE_TYPES)
  type?: string;
}
