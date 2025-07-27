import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsString, MinLength, IsOptional } from "class-validator"

export class RegisterUserDto {
  @ApiProperty({ example: "john.doe@example.com", description: "User email address" })
  @IsEmail()
  email: string

  @ApiProperty({ example: "password123", description: "User password (min 6 characters)" })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string

  @ApiProperty({
    example: "user",
    description: 'Optional role name for the user (e.g., "user", "admin")',
    required: false,
  })
  @IsOptional()
  @IsString()
  roleName?: string // Optional: for initial role assignment, e.g., 'user'
}
