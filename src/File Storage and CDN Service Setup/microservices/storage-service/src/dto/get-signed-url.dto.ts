import { IsOptional, IsNumber, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class GetSignedUrlDto {
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(604800) // 7 days
  @Type(() => Number)
  expiresIn?: number;
}
