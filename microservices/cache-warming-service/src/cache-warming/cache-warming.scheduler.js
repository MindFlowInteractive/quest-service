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
var CacheWarmingScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheWarmingScheduler = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const cache_warming_service_1 = require("./cache-warming.service");
const cache_job_entity_1 = require("./entities/cache-job.entity");
let CacheWarmingScheduler = CacheWarmingScheduler_1 = class CacheWarmingScheduler {
    constructor(cacheWarmingService, configService) {
        this.cacheWarmingService = cacheWarmingService;
        this.configService = configService;
        this.logger = new common_1.Logger(CacheWarmingScheduler_1.name);
    }
    async processDueJobs() {
        if (!this.isSchedulerEnabled()) {
            return;
        }
        const jobs = await this.cacheWarmingService.processDueJobs();
        if (jobs.length > 0) {
            this.logger.log(`Processed ${jobs.length} scheduled cache warming jobs`);
        }
    }
    async warmPopularData() {
        if (!this.isSchedulerEnabled()) {
            return;
        }
        await this.cacheWarmingService.runWarmingJob({
            name: 'scheduled-popular-cache-warming',
            type: cache_job_entity_1.CacheJobType.WARM,
            limit: Number(this.configService.get('CACHE_WARMING_LIMIT') || '50'),
            priority: 25,
        });
    }
    async invalidateExpiredSchedules() {
        if (!this.isSchedulerEnabled()) {
            return;
        }
        const invalidated = await this.cacheWarmingService.invalidateDuePreloadData();
        if (invalidated > 0) {
            this.logger.log(`Invalidated ${invalidated} keys from preload schedules`);
        }
    }
    async adaptiveWarming() {
        if (!this.isSchedulerEnabled()) {
            return;
        }
        await this.cacheWarmingService.runWarmingJob({
            name: 'adaptive-time-window-cache-warming',
            type: cache_job_entity_1.CacheJobType.ADAPTIVE,
            limit: Number(this.configService.get('CACHE_ADAPTIVE_WARMING_LIMIT') || '30'),
            adaptive: true,
            priority: 40,
            metadata: {
                warmWindow: this.cacheWarmingService.getCurrentWarmWindow(),
            },
        });
    }
    async optimizeHitRate() {
        if (!this.isSchedulerEnabled()) {
            return;
        }
        const stats = await this.cacheWarmingService.optimizeHitRate();
        this.logger.log(`Cache hit rate sample: ${(stats.hitRate * 100).toFixed(2)}%`);
    }
    isSchedulerEnabled() {
        return (this.configService.get('CACHE_WARMING_SCHEDULER_ENABLED', 'true') !== 'false');
    }
};
exports.CacheWarmingScheduler = CacheWarmingScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CacheWarmingScheduler.prototype, "processDueJobs", null);
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CacheWarmingScheduler.prototype, "warmPopularData", null);
__decorate([
    (0, schedule_1.Cron)('*/15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CacheWarmingScheduler.prototype, "invalidateExpiredSchedules", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CacheWarmingScheduler.prototype, "adaptiveWarming", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CacheWarmingScheduler.prototype, "optimizeHitRate", null);
exports.CacheWarmingScheduler = CacheWarmingScheduler = CacheWarmingScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cache_warming_service_1.CacheWarmingService,
        config_1.ConfigService])
], CacheWarmingScheduler);
//# sourceMappingURL=cache-warming.scheduler.js.map