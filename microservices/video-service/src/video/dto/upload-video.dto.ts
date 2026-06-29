import { IsOptional, IsString } from 'class-validator';

export class UploadVideoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
