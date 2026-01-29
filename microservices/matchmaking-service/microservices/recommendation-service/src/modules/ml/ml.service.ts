import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MLService {
    private readonly logger = new Logger(MLService.name);

    async predictPreference(playerId: string, puzzleId: string): Promise<number> {
        this.logger.log(`Predicting preference for player ${playerId} on puzzle ${puzzleId}`);
        // Mocking a call to a Python/TensorFlow service or local regression model
        // In a real scenario, we might use a library like 'tensorflow-node' or call an external API
        return Math.random(); // Predicted score 0 to 1
    }

    async rankRecommendations(playerId: string, puzzleIds: string[]): Promise<string[]> {
        // Sort puzzleIds based on predicted score
        const scored = await Promise.all(puzzleIds.map(async id => ({
            id,
            score: await this.predictPreference(playerId, id)
        })));

        return scored
            .sort((a, b) => b.score - a.score)
            .map(s => s.id);
    }
}
