import { IsNotEmpty, IsString, MinLength } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class VerifyTwoFactorDto {
  @ApiProperty({ description: "TOTP code from authenticator app", example: "123456" })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  code: string
}

export class ChallengeTwoFactorDto {
  @ApiProperty({ description: "TOTP code or backup code", example: "123456" })
  @IsNotEmpty()
  @IsString()
  code: string
}

export class DisableTwoFactorDto {
  @ApiProperty({ description: "Current TOTP code", example: "123456" })
  @IsNotEmpty()
  @IsString()
  code: string

  @ApiProperty({ description: "User password for confirmation", example: "password123" })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string
}
