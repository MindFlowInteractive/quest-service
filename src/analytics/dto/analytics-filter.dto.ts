import { IsOptional, IsString, IsISO8601, IsNumberString } from 'class-validator';


export class AnalyticsFilterDto {
@IsOptional()
@IsISO8601()
from?: string;


@IsOptional()
@IsISO8601()
to?: string;


@IsOptional()
@IsString()
tenantId?: string;


@IsOptional()
@IsString()
userId?: string;


@IsOptional()
@IsString()
eventType?: string;


@IsOptional()
@IsNumberString()
page?: number;


@IsOptional()
@IsNumberString()
perPage?: number;
}