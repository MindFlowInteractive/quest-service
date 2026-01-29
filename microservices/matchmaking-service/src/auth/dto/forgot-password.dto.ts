import { ApiProperty } from "@nestjs/swagger"
import { IsEmail } from "class-validator"

export class ForgotPasswordDto {
  @ApiProperty({ example: "john.doe@example.com", description: "Email address to send password reset link to" })
  @IsEmail()
  email: string
}
