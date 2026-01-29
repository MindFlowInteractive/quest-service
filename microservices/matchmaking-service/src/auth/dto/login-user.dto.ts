import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsString } from "class-validator"

export class LoginUserDto {
  @ApiProperty({ example: "john.doe@example.com", description: "User email address" })
  @IsEmail()
  email: string

  @ApiProperty({ example: "password123", description: "User password" })
  @IsString()
  password: string
}
