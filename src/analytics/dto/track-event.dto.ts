export class TrackEventDto {
  @IsString()
  eventType: string;

  @IsString()
  playerId: string;

  @IsString()
  sessionId: string;

  @IsOptional()
  metadata?: Record<string, any>;
}