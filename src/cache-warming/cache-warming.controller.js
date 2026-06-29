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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheWarmingController = void 0;
const common_1 = require("@nestjs/common");
const cache_warming_service_1 = require("./cache-warming.service");
const create_preload_data_dto_1 = require("./dto/create-preload-data.dto");
const record_access_dto_1 = require("./dto/record-access.dto");
const schedule_invalidation_dto_1 = require("./dto/schedule-invalidation.dto");
const warm_request_dto_1 = require("./dto/warm-request.dto");
const cache_job_entity_1 = require("./entities/cache-job.entity");
let CacheWarmingController = class CacheWarmingController {
    constructor(cacheWarmingService) {
        this.cacheWarmingService = cacheWarmingService;
    }
    dashboard() {
        return this.cacheWarmingService.getDashboard();
    }
    preloadData(limit) {
        return this.cacheWarmingService.listPreloadData(this.toLimit(limit, 100));
    }
    upsertPreloadData(dto) {
        return this.cacheWarmingService.upsertPreloadData(dto);
    }
    recordAccess(dto) {
        return this.cacheWarmingService.recordAccess(dto);
    }
    candidates(limit) {
        return this.cacheWarmingService.getTopCandidates(this.toLimit(limit, 25));
    }
    warm(dto) {
        return this.cacheWarmingService.runWarmingJob({
            name: dto.adaptive
                ? 'manual-adaptive-cache-warming'
                : 'manual-cache-warming',
            type: dto.adaptive ? cache_job_entity_1.CacheJobType.ADAPTIVE : cache_job_entity_1.CacheJobType.WARM,
            limit: dto.limit,
            keys: dto.keys,
            adaptive: dto.adaptive,
            priority: 100,
        });
    }
    invalidate(dto) {
        return this.cacheWarmingService.invalidateNow({
            key: dto.key,
            keys: dto.keys,
            pattern: dto.pattern,
        });
    }
    scheduleInvalidation(dto) {
        return this.cacheWarmingService.scheduleInvalidation(dto);
    }
    optimizeHitRate() {
        return this.cacheWarmingService.optimizeHitRate();
    }
    jobs(limit) {
        return this.cacheWarmingService.listJobs(this.toLimit(limit, 50));
    }
    metrics(limit) {
        return this.cacheWarmingService.listMetrics(this.toLimit(limit, 100));
    }
    toLimit(value, fallback) {
        if (!value) {
            return fallback;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }
};
exports.CacheWarmingController = CacheWarmingController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CacheWarmingController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('preload-data'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CacheWarmingController.prototype, "preloadData", null);
__decorate([
    (0, common_1.Post)('preload-data'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_preload_data_dto_1.CreatePreloadDataDto]),
    __metadata("design:returntype", void 0)
], CacheWarmingController.prototype, "upsertPreloadData", null);
__decorate([
    (0, common_1.Post)('access'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [record_access_dto_1.RecordAccessDto]),
    __metadata("design:returntype", void 0)
], CacheWarmingController.prototype, "recordAccess", null);
__decorate([
    (0, common_1.Get)('candidates'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CacheWarmingController.prototype, "candidates", null);
__decorate([
    (0, common_1.Post)('warm'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [warm_request_dto_1.WarmRequestDto]),
    __metadata("design:returntype", void 0)
], CacheWarmingController.prototype, "warm", null);
__decorate([
    (0, common_1.Post)('invalidate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [schedule_invalidation_dto_1.ScheduleInvalidationDto]),
    __metadata("design:returntype", void 0)
], CacheWarmingController.prototype, "invalidate", null);
__decorate([
    (0, common_1.Post)('invalidate/schedule'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [schedule_invalidation_dto_1.ScheduleInvalidationDto]),
    __metadata("design:returntype", void 0)
], CacheWarmingController.prototype, "scheduleInvalidation", null);
__decorate([
    (0, common_1.Post)('optimize'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CacheWarmingController.prototype, "optimizeHitRate", null);
__decorate([
    (0, common_1.Get)('jobs'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CacheWarmingController.prototype, "jobs", null);
__decorate([
    (0, common_1.Get)('metrics'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CacheWarmingController.prototype, "metrics", null);
exports.CacheWarmingController = CacheWarmingController = __decorate([
    (0, common_1.Controller)('cache-warming'),
    __metadata("design:paramtypes", [cache_warming_service_1.CacheWarmingService])
], CacheWarmingController);
//# sourceMappingURL=cache-warming.controller.js.map