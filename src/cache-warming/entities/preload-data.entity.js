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
exports.PreloadData = exports.WarmWindow = exports.PreloadSourceType = void 0;
const typeorm_1 = require("typeorm");
var PreloadSourceType;
(function (PreloadSourceType) {
    PreloadSourceType["PUZZLE"] = "puzzle";
    PreloadSourceType["LEADERBOARD"] = "leaderboard";
    PreloadSourceType["ACHIEVEMENT"] = "achievement";
    PreloadSourceType["PLAYER_PROFILE"] = "player_profile";
    PreloadSourceType["CONFIG"] = "config";
    PreloadSourceType["BLOCKCHAIN"] = "blockchain";
    PreloadSourceType["CUSTOM"] = "custom";
})(PreloadSourceType || (exports.PreloadSourceType = PreloadSourceType = {}));
var WarmWindow;
(function (WarmWindow) {
    WarmWindow["ALWAYS"] = "always";
    WarmWindow["MORNING"] = "morning";
    WarmWindow["AFTERNOON"] = "afternoon";
    WarmWindow["EVENING"] = "evening";
    WarmWindow["NIGHT"] = "night";
})(WarmWindow || (exports.WarmWindow = WarmWindow = {}));
let PreloadData = class PreloadData {
};
exports.PreloadData = PreloadData;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PreloadData.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 240 }),
    __metadata("design:type", String)
], PreloadData.prototype, "cacheKey", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PreloadSourceType,
        default: PreloadSourceType.CUSTOM,
    }),
    __metadata("design:type", String)
], PreloadData.prototype, "sourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PreloadData.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], PreloadData.prototype, "fetchUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], PreloadData.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PreloadData.prototype, "accessCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PreloadData.prototype, "hitCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PreloadData.prototype, "missCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], PreloadData.prototype, "popularityScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PreloadData.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 3600 }),
    __metadata("design:type", Number)
], PreloadData.prototype, "ttlSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], PreloadData.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: WarmWindow, default: WarmWindow.ALWAYS }),
    __metadata("design:type", String)
], PreloadData.prototype, "warmWindow", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], PreloadData.prototype, "lastAccessedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], PreloadData.prototype, "lastWarmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], PreloadData.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], PreloadData.prototype, "invalidationIntervalSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], PreloadData.prototype, "nextInvalidationAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], PreloadData.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], PreloadData.prototype, "updatedAt", void 0);
exports.PreloadData = PreloadData = __decorate([
    (0, typeorm_1.Entity)('preload_data')
], PreloadData);
//# sourceMappingURL=preload-data.entity.js.map