import { RecommendationService } from './recommendation.service';
export declare class RecommendationController {
    private readonly recommendationService;
    constructor(recommendationService: RecommendationService);
    getRecommendations(playerId: string): Promise<string[]>;
    trackAction(body: {
        playerId: string;
        puzzleId: string;
        action: string;
        metadata?: any;
    }): Promise<void>;
    handleGetRecommendations(data: {
        playerId: string;
    }): Promise<string[]>;
    handleTrackBehavior(data: {
        playerId: string;
        puzzleId: string;
        action: string;
        metadata?: any;
    }): Promise<void>;
}
