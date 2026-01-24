import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';
import { plainToInstance, Transform } from 'class-transformer';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: any }) => parseInt(value, 10))
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api/v1';

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:3000';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: any }) => parseInt(value, 10))
  THROTTLE_TTL: number = 60000; // 1 minute

  @IsNumber()
  @IsOptional()
  @Transform(({ value }: { value: any }) => parseInt(value, 10))
  THROTTLE_LIMIT: number = 100; // 100 requests per minute

  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info';

  // Database configuration (placeholder for future use)
  @IsString()
  @IsOptional()
  DATABASE_URL?: string;

  // JWT configuration (placeholder for future use)
  @IsString()
  @IsOptional()
  JWT_SECRET?: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string = '1d';
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
