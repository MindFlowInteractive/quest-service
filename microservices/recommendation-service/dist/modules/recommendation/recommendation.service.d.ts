import { Repository } from 'typeorm';
import { Recommendation } from './entities/recommendation.entity';
import { History } from '../history/entities/history.entity';
import { Preference } from '../preference/entities/preference.entity';
import { Cache } from 'cache-manager';
import { ABTestingService } from '../ab-testing/ab-testing.service';
import { BehaviorService } from '../behavior/behavior.service';
import { MLService } from '../ml/ml.service';
export declare class RecommendationService {
    private recommendationRepository;
    private historyRepository;
    private preferenceRepository;
    private cacheManager;
    private readonly abTestingService;
    private readonly behaviorService;
    private readonly mlService;
    private readonly logger;
    constructor(recommendationRepository: Repository<Recommendation>, historyRepository: Repository<History>, preferenceRepository: Repository<Preference>, cacheManager: Cache, abTestingService: ABTestingService, behaviorService: BehaviorService, mlService: MLService);
    getRecommendations(playerId: string): Promise<string[]>;
    generatePersonalizedFeed(playerId: string): Promise<string[]>;
    private collaborativeFiltering;
    private contentBasedFiltering;
    trackAction(playerId: string, puzzleId: string, action: string, metadata?: any): Promise<void>;
}
