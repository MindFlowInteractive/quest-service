import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Recommendation } from './entities/recommendation.entity';
import { History } from '../history/entities/history.entity';
import { Preference } from '../preference/entities/preference.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ABTestingService } from '../ab-testing/ab-testing.service';
import { BehaviorService } from '../behavior/behavior.service';
import { MLService } from '../ml/ml.service';

@Injectable()
export class RecommendationService {
    private readonly logger = new Logger(RecommendationService.name);

    constructor(
        @InjectRepository(Recommendation)
        private recommendationRepository: Repository<Recommendation>,
        @InjectRepository(History)
        private historyRepository: Repository<History>,
        @InjectRepository(Preference)
        private preferenceRepository: Repository<Preference>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly abTestingService: ABTestingService,
        private readonly behaviorService: BehaviorService,
        private readonly mlService: MLService,
    ) { }

    async getRecommendations(playerId: string): Promise<string[]> {
        const cacheKey = `recommendations:${playerId}`;
        const cached = await this.cacheManager.get<string[]>(cacheKey);
        if (cached) return cached;

        const recommendations = await this.generatePersonalizedFeed(playerId);
        await this.cacheManager.set(cacheKey, recommendations, 3600);
        return recommendations;
    }

    async generatePersonalizedFeed(playerId: string): Promise<string[]> {
        this.logger.log(`Generating personalized feed for player ${playerId}`);

        // A/B Testing
        const variant = await this.abTestingService.getVariant(playerId, 'rec_algorithm_v1');

        // Behavior Analysis
        const skillLevel = await this.behaviorService.analyzeSkillLevel(playerId);
        const interests = await this.behaviorService.getRecentInterests(playerId);

        let suggestions: string[];

        if (variant === 'B') {
            // Experimental: Collaborative filtering ranked by ML
            const candidates = await this.collaborativeFiltering(playerId, 20);
            suggestions = await this.mlService.rankRecommendations(playerId, candidates);
        } else {
            // Control: Hybrid approach
            const collaborative = await this.collaborativeFiltering(playerId, 10);
            const content = await this.contentBasedFiltering(playerId, skillLevel, interests);
            const combined = Array.from(new Set([...collaborative, ...content]));
            // Still use ML to rank the combined list
            suggestions = await this.mlService.rankRecommendations(playerId, combined);
        }

        // Save record
        const rec = this.recommendationRepository.create({
            playerId,
            puzzleIds: suggestions,
            algorithm: variant === 'B' ? 'collaborative_ml_ranked' : 'hybrid_ml_ranked',
            abTestGroup: variant,
            generatedAt: new Date(),
        });
        await this.recommendationRepository.save(rec);

        return suggestions;
    }

    private async collaborativeFiltering(playerId: string, limit: number = 10): Promise<string[]> {
        const userHistory = await this.historyRepository.find({ where: { playerId } });
        const playedPuzzleIds = userHistory.map(h => h.puzzleId);

        const similarUsers = await this.historyRepository.find({
            where: { puzzleId: In(playedPuzzleIds), playerId: Not(playerId) },
            select: ['playerId']
        });
        const similarPlayerIds = [...new Set(similarUsers.map(u => u.playerId))];

        if (similarPlayerIds.length === 0) return [];

        const suggestions = await this.historyRepository.find({
            where: {
                playerId: In(similarPlayerIds),
                puzzleId: playedPuzzleIds.length > 0 ? Not(In(playedPuzzleIds)) : undefined,
                action: In(['complete', 'rate'])
            },
            order: { rating: 'DESC' },
            take: limit
        });

        return [...new Set(suggestions.map(s => s.puzzleId))];
    }

    private async contentBasedFiltering(playerId: string, skill: number, interests: string[]): Promise<string[]> {
        const preference = await this.preferenceRepository.findOne({ where: { playerId } });
        // This part requires access to puzzle metadata (categories, difficulty)
        // For now we simulate finding 5 puzzles based on interests
        return interests.length > 0 ? [`puzzle_sim_${interests[0]}_1`, `puzzle_sim_${interests[0]}_2`] : [];
    }

    async trackAction(playerId: string, puzzleId: string, action: string, metadata?: any): Promise<void> {
        const history = this.historyRepository.create({
            playerId,
            puzzleId,
            action,
            metadata,
        });
        await this.historyRepository.save(history);

        if (['complete', 'rate'].includes(action)) {
            await this.cacheManager.del(`recommendations:${playerId}`);
        }

        if (action === 'click_recommendation') {
            this.logger.log(`CTR Tracked: Player ${playerId} clicked ${puzzleId}`);
        }
    }
}
