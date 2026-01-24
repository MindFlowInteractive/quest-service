"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const recommendation_service_1 = require("./recommendation.service");
const recommendation_controller_1 = require("./recommendation.controller");
const recommendation_entity_1 = require("./entities/recommendation.entity");
const history_entity_1 = require("../history/entities/history.entity");
const preference_entity_1 = require("../preference/entities/preference.entity");
const ab_testing_module_1 = require("../ab-testing/ab-testing.module");
const behavior_module_1 = require("../behavior/behavior.module");
const ml_module_1 = require("../ml/ml.module");
let RecommendationModule = class RecommendationModule {
};
exports.RecommendationModule = RecommendationModule;
exports.RecommendationModule = RecommendationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([recommendation_entity_1.Recommendation, history_entity_1.History, preference_entity_1.Preference]),
            ab_testing_module_1.ABTestingModule,
            behavior_module_1.BehaviorModule,
            ml_module_1.MLModule,
        ],
        providers: [recommendation_service_1.RecommendationService],
        controllers: [recommendation_controller_1.RecommendationController],
        exports: [recommendation_service_1.RecommendationService],
    })
], RecommendationModule);
//# sourceMappingURL=recommendation.module.js.map