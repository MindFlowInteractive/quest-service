export declare enum CacheJobStatus {
    PENDING = "pending",
    RUNNING = "running",
    SUCCEEDED = "succeeded",
    FAILED = "failed",
    SKIPPED = "skipped"
}
export declare enum CacheJobType {
    WARM = "warm",
    INVALIDATE = "invalidate",
    OPTIMIZE = "optimize",
    ADAPTIVE = "adaptive"
}
export declare class CacheJob {
    id: string;
    name: string;
    type: CacheJobType;
    status: CacheJobStatus;
    priority: number;
    scheduledFor: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    targetKeys: string[];
    targetPattern: string | null;
    metadata: Record<string, unknown>;
    warmedKeys: number;
    skippedKeys: number;
    invalidatedKeys: number;
    durationMs: number | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
}
