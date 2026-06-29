export declare enum PreloadSourceType {
    PUZZLE = "puzzle",
    LEADERBOARD = "leaderboard",
    ACHIEVEMENT = "achievement",
    PLAYER_PROFILE = "player_profile",
    CONFIG = "config",
    BLOCKCHAIN = "blockchain",
    CUSTOM = "custom"
}
export declare enum WarmWindow {
    ALWAYS = "always",
    MORNING = "morning",
    AFTERNOON = "afternoon",
    EVENING = "evening",
    NIGHT = "night"
}
export declare class PreloadData {
    id: string;
    cacheKey: string;
    sourceType: PreloadSourceType;
    payload: Record<string, unknown> | null;
    fetchUrl: string | null;
    tags: string[];
    accessCount: number;
    hitCount: number;
    missCount: number;
    popularityScore: number;
    priority: number;
    ttlSeconds: number;
    isActive: boolean;
    warmWindow: WarmWindow;
    lastAccessedAt: Date | null;
    lastWarmedAt: Date | null;
    expiresAt: Date | null;
    invalidationIntervalSeconds: number | null;
    nextInvalidationAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
