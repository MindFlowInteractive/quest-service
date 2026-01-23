import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { Recommendation } from './entities/recommendation.entity';
import { History } from '../history/entities/history.entity';
import { Preference } from '../preference/entities/preference.entity';
import { ABTestingModule } from '../ab-testing/ab-testing.module';
import { BehaviorModule } from '../behavior/behavior.module';
import { MLModule } from '../ml/ml.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Recommendation, History, Preference]),
        ABTestingModule,
        BehaviorModule,
        MLModule,
    ],
    providers: [RecommendationService],
    controllers: [RecommendationController],
    exports: [RecommendationService],
})
export class RecommendationModule { }
