import { ApiProperty } from "@nestjs/swagger"
import { IsString, MinLength } from "class-validator"

export class ResetPasswordDto {
  @ApiProperty({
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    description: "Password reset token received via email",
  })
  @IsString()
  token: string

  @ApiProperty({ example: "newStrongPassword123", description: "New password (min 6 characters)" })
  @IsString()
  @MinLength(6, { message: "New password must be at least 6 characters long" })
  newPassword: string
}
