import { IsEmail, IsString, MinLength } from 'class-validator';
import { IsSafeString, IsStrongPassword, Trim } from '../../validators';

export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @IsSafeString()
  @Trim()
  username: string;

  @IsEmail()
  @IsSafeString()
  @Trim()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsString()
  @IsSafeString()
  @Trim()
  firstName: string;

  @IsString()
  @IsSafeString()
  @Trim()
  lastName: string;
}
