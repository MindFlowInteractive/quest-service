import { IsString } from 'class-validator';

export class TrackConversionDto {
  @IsString()
  user_id: string;

  @IsString()
  event_type: string;
}