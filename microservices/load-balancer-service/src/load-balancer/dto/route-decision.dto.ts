import { IsString, IsOptional, IsEnum, IsUrl, IsNumber, Min } from 'class-validator';

export enum RoutingStrategy {
  ROUND_ROBIN = 'round_robin',
  WEIGHTED = 'weighted',
  LEAST_CONNECTIONS = 'least_connections',
  RATE_BASED = 'rate_based',
}

export class RouteDecisionDto {
  @IsString()
  route: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  algorithm?: RoutingStrategy;

  @IsNumber()
  @Min(0)
  @IsOptional()
  requestCount?: number;

  @IsString()
  @IsOptional()
  clientIp?: string;
}
