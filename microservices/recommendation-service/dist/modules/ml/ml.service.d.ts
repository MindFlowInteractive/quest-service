export declare class MLService {
    private readonly logger;
    predictPreference(playerId: string, puzzleId: string): Promise<number>;
    rankRecommendations(playerId: string, puzzleIds: string[]): Promise<string[]>;
}
