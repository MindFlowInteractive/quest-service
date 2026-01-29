import { IsEmail, IsString, IsOptional, IsObject, IsIn } from 'class-validator';

export class CreatePlayerDto {
  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsOptional()
  @IsObject()
  preferences?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    type?: string;
  };
}