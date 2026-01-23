"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RecommendationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const recommendation_entity_1 = require("./entities/recommendation.entity");
const history_entity_1 = require("../history/entities/history.entity");
const preference_entity_1 = require("../preference/entities/preference.entity");
const cache_manager_1 = require("@nestjs/cache-manager");
const common_2 = require("@nestjs/common");
const ab_testing_service_1 = require("../ab-testing/ab-testing.service");
const behavior_service_1 = require("../behavior/behavior.service");
const ml_service_1 = require("../ml/ml.service");
let RecommendationService = RecommendationService_1 = class RecommendationService {
    constructor(recommendationRepository, historyRepository, preferenceRepository, cacheManager, abTestingService, behaviorService, mlService) {
        this.recommendationRepository = recommendationRepository;
        this.historyRepository = historyRepository;
        this.preferenceRepository = preferenceRepository;
        this.cacheManager = cacheManager;
        this.abTestingService = abTestingService;
        this.behaviorService = behaviorService;
        this.mlService = mlService;
        this.logger = new common_1.Logger(RecommendationService_1.name);
    }
    async getRecommendations(playerId) {
        const cacheKey = `recommendations:${playerId}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const recommendations = await this.generatePersonalizedFeed(playerId);
        await this.cacheManager.set(cacheKey, recommendations, 3600);
        return recommendations;
    }
    async generatePersonalizedFeed(playerId) {
        this.logger.log(`Generating personalized feed for player ${playerId}`);
        const variant = await this.abTestingService.getVariant(playerId, 'rec_algorithm_v1');
        const skillLevel = await this.behaviorService.analyzeSkillLevel(playerId);
        const interests = await this.behaviorService.getRecentInterests(playerId);
        let suggestions;
        if (variant === 'B') {
            const candidates = await this.collaborativeFiltering(playerId, 20);
            suggestions = await this.mlService.rankRecommendations(playerId, candidates);
        }
        else {
            const collaborative = await this.collaborativeFiltering(playerId, 10);
            const content = await this.contentBasedFiltering(playerId, skillLevel, interests);
            const combined = Array.from(new Set([...collaborative, ...content]));
            suggestions = await this.mlService.rankRecommendations(playerId, combined);
        }
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
    async collaborativeFiltering(playerId, limit = 10) {
        const userHistory = await this.historyRepository.find({ where: { playerId } });
        const playedPuzzleIds = userHistory.map(h => h.puzzleId);
        const similarUsers = await this.historyRepository.find({
            where: { puzzleId: (0, typeorm_2.In)(playedPuzzleIds), playerId: (0, typeorm_2.Not)(playerId) },
            select: ['playerId']
        });
        const similarPlayerIds = [...new Set(similarUsers.map(u => u.playerId))];
        if (similarPlayerIds.length === 0)
            return [];
        const suggestions = await this.historyRepository.find({
            where: {
                playerId: (0, typeorm_2.In)(similarPlayerIds),
                puzzleId: playedPuzzleIds.length > 0 ? (0, typeorm_2.Not)((0, typeorm_2.In)(playedPuzzleIds)) : undefined,
                action: (0, typeorm_2.In)(['complete', 'rate'])
            },
            order: { rating: 'DESC' },
            take: limit
        });
        return [...new Set(suggestions.map(s => s.puzzleId))];
    }
    async contentBasedFiltering(playerId, skill, interests) {
        const preference = await this.preferenceRepository.findOne({ where: { playerId } });
        return interests.length > 0 ? [`puzzle_sim_${interests[0]}_1`, `puzzle_sim_${interests[0]}_2`] : [];
    }
    async trackAction(playerId, puzzleId, action, metadata) {
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
};
exports.RecommendationService = RecommendationService;
exports.RecommendationService = RecommendationService = RecommendationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(recommendation_entity_1.Recommendation)),
    __param(1, (0, typeorm_1.InjectRepository)(history_entity_1.History)),
    __param(2, (0, typeorm_1.InjectRepository)(preference_entity_1.Preference)),
    __param(3, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object, ab_testing_service_1.ABTestingService,
        behavior_service_1.BehaviorService,
        ml_service_1.MLService])
], RecommendationService);
//# sourceMappingURL=recommendation.service.js.map