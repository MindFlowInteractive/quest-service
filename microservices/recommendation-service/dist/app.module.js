"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const cache_manager_1 = require("@nestjs/cache-manager");
const cache_manager_redis_yet_1 = require("cache-manager-redis-yet");
const recommendation_module_1 = require("./modules/recommendation/recommendation.module");
const preference_module_1 = require("./modules/preference/preference.module");
const history_module_1 = require("./modules/history/history.module");
const behavior_module_1 = require("./modules/behavior/behavior.module");
const ab_testing_module_1 = require("./modules/ab-testing/ab-testing.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const host = configService.get('DATABASE_HOST');
                    if (!host) {
                        return {
                            type: 'sqlite',
                            database: 'db.sqlite',
                            autoLoadEntities: true,
                            synchronize: true,
                        };
                    }
                    return {
                        type: 'postgres',
                        host: host,
                        port: configService.get('DATABASE_PORT', 5432),
                        username: configService.get('DATABASE_USER', 'postgres'),
                        password: configService.get('DATABASE_PASSWORD', 'postgres'),
                        database: configService.get('DATABASE_NAME', 'recommendation_db'),
                        autoLoadEntities: true,
                        synchronize: true,
                    };
                },
                inject: [config_1.ConfigService],
            }),
            cache_manager_1.CacheModule.registerAsync({
                isGlobal: true,
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => {
                    const redisHost = configService.get('REDIS_HOST');
                    if (!redisHost) {
                        return { store: 'memory' };
                    }
                    return {
                        store: await (0, cache_manager_redis_yet_1.redisStore)({
                            socket: {
                                host: redisHost,
                                port: configService.get('REDIS_PORT', 6379),
                            },
                        }),
                    };
                },
                inject: [config_1.ConfigService],
            }),
            recommendation_module_1.RecommendationModule,
            preference_module_1.PreferenceModule,
            history_module_1.HistoryModule,
            behavior_module_1.BehaviorModule,
            ab_testing_module_1.ABTestingModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map