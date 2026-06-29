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
exports.Metric = exports.MetricName = void 0;
const typeorm_1 = require("typeorm");
var MetricName;
(function (MetricName) {
    MetricName["WARMING_RUN"] = "warming_run";
    MetricName["CACHE_HIT_RATE"] = "cache_hit_rate";
    MetricName["PRELOAD_LATENCY"] = "preload_latency";
    MetricName["INVALIDATION_RUN"] = "invalidation_run";
    MetricName["OPTIMIZATION"] = "optimization";
    MetricName["ERROR"] = "error";
})(MetricName || (exports.MetricName = MetricName = {}));
let Metric = class Metric {
};
exports.Metric = Metric;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Metric.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MetricName }),
    __metadata("design:type", String)
], Metric.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 240, nullable: true }),
    __metadata("design:type", String)
], Metric.prototype, "cacheKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], Metric.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, default: 'count' }),
    __metadata("design:type", String)
], Metric.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'{}'" }),
    __metadata("design:type", Object)
], Metric.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Metric.prototype, "windowStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Metric.prototype, "windowEnd", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Metric.prototype, "createdAt", void 0);
exports.Metric = Metric = __decorate([
    (0, typeorm_1.Entity)('metrics')
], Metric);
//# sourceMappingURL=metric.entity.js.map