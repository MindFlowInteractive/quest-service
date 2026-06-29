import { PreloadSourceType, WarmWindow } from '../entities/preload-data.entity';
export declare class CreatePreloadDataDto {
    cacheKey: string;
    sourceType?: PreloadSourceType;
    payload?: Record<string, unknown>;
    fetchUrl?: string;
    tags?: string[];
    priority?: number;
    ttlSeconds?: number;
    isActive?: boolean;
    warmWindow?: WarmWindow;
    invalidationIntervalSeconds?: number;
}
