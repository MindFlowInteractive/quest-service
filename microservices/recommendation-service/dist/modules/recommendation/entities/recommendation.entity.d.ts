export declare class Recommendation {
    id: string;
    playerId: string;
    puzzleIds: string[];
    algorithm: string;
    abTestGroup?: string;
    generatedAt: Date;
    expiresAt?: Date;
}
