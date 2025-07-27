import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

export class VerifyEmailDto {
  @ApiProperty({
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    description: "Email verification token received via email",
  })
  @IsString()
  token: string
}
