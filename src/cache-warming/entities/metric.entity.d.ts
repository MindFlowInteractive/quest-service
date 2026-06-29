export declare enum MetricName {
    WARMING_RUN = "warming_run",
    CACHE_HIT_RATE = "cache_hit_rate",
    PRELOAD_LATENCY = "preload_latency",
    INVALIDATION_RUN = "invalidation_run",
    OPTIMIZATION = "optimization",
    ERROR = "error"
}
export declare class Metric {
    id: string;
    name: MetricName;
    cacheKey: string | null;
    value: number;
    unit: string;
    tags: Record<string, unknown>;
    windowStart: Date | null;
    windowEnd: Date | null;
    createdAt: Date;
}
