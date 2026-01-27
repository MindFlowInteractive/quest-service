import {
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
} from "class-validator";

export class UploadFileDto {
  @IsEnum(["puzzle", "avatar", "asset", "other"])
  category: "puzzle" | "avatar" | "asset" | "other";

  @IsString()
  userId: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
