"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheWarmingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cache_warming_controller_1 = require("./cache-warming.controller");
const cache_warming_scheduler_1 = require("./cache-warming.scheduler");
const cache_warming_service_1 = require("./cache-warming.service");
const cache_job_entity_1 = require("./entities/cache-job.entity");
const metric_entity_1 = require("./entities/metric.entity");
const preload_data_entity_1 = require("./entities/preload-data.entity");
const redis_cache_service_1 = require("./redis-cache.service");
let CacheWarmingModule = class CacheWarmingModule {
};
exports.CacheWarmingModule = CacheWarmingModule;
exports.CacheWarmingModule = CacheWarmingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([cache_job_entity_1.CacheJob, preload_data_entity_1.PreloadData, metric_entity_1.Metric])],
        controllers: [cache_warming_controller_1.CacheWarmingController],
        providers: [cache_warming_service_1.CacheWarmingService, cache_warming_scheduler_1.CacheWarmingScheduler, redis_cache_service_1.RedisCacheService],
        exports: [cache_warming_service_1.CacheWarmingService],
    })
], CacheWarmingModule);
//# sourceMappingURL=cache-warming.module.js.map