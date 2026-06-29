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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheJob = exports.CacheJobType = exports.CacheJobStatus = void 0;
const typeorm_1 = require("typeorm");
var CacheJobStatus;
(function (CacheJobStatus) {
    CacheJobStatus["PENDING"] = "pending";
    CacheJobStatus["RUNNING"] = "running";
    CacheJobStatus["SUCCEEDED"] = "succeeded";
    CacheJobStatus["FAILED"] = "failed";
    CacheJobStatus["SKIPPED"] = "skipped";
})(CacheJobStatus || (exports.CacheJobStatus = CacheJobStatus = {}));
var CacheJobType;
(function (CacheJobType) {
    CacheJobType["WARM"] = "warm";
    CacheJobType["INVALIDATE"] = "invalidate";
    CacheJobType["OPTIMIZE"] = "optimize";
    CacheJobType["ADAPTIVE"] = "adaptive";
})(CacheJobType || (exports.CacheJobType = CacheJobType = {}));
let CacheJob = class CacheJob {
};
exports.CacheJob = CacheJob;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CacheJob.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], CacheJob.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CacheJobType }),
    __metadata("design:type", String)
], CacheJob.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CacheJobStatus,
        default: CacheJobStatus.PENDING,
    }),
    __metadata("design:type", String)
], CacheJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CacheJob.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CacheJob.prototype, "scheduledFor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], CacheJob.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], CacheJob.prototype, "finishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], CacheJob.prototype, "targetKeys", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300, nullable: true }),
    __metadata("design:type", String)
], CacheJob.prototype, "targetPattern", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'{}'" }),
    __metadata("design:type", Object)
], CacheJob.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CacheJob.prototype, "warmedKeys", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CacheJob.prototype, "skippedKeys", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CacheJob.prototype, "invalidatedKeys", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], CacheJob.prototype, "durationMs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CacheJob.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CacheJob.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], CacheJob.prototype, "updatedAt", void 0);
exports.CacheJob = CacheJob = __decorate([
    (0, typeorm_1.Entity)('cache_jobs')
], CacheJob);
//# sourceMappingURL=cache-job.entity.js.map