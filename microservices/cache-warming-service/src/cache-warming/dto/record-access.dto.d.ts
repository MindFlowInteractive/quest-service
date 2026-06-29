import { PreloadSourceType } from '../entities/preload-data.entity';
export declare class RecordAccessDto {
    cacheKey: string;
    hit: boolean;
    sourceType?: PreloadSourceType;
    tags?: string[];
    ttlSeconds?: number;
}
