import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsObject()
  partialState: Record<string, any>;
}
