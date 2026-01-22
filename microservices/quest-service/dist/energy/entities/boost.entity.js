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
exports.EnergyBoost = exports.BoostType = void 0;
const typeorm_1 = require("typeorm");
var BoostType;
(function (BoostType) {
    BoostType["REGEN_SPEED"] = "REGEN_SPEED";
    BoostType["EXTRA_CAPACITY"] = "EXTRA_CAPACITY";
    BoostType["UNLIMITED"] = "UNLIMITED";
})(BoostType || (exports.BoostType = BoostType = {}));
let EnergyBoost = class EnergyBoost {
    id;
    userId;
    type;
    multiplier;
    expiresAt;
    createdAt;
};
exports.EnergyBoost = EnergyBoost;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EnergyBoost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EnergyBoost.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: BoostType,
    }),
    __metadata("design:type", String)
], EnergyBoost.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 1.0 }),
    __metadata("design:type", Number)
], EnergyBoost.prototype, "multiplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EnergyBoost.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EnergyBoost.prototype, "createdAt", void 0);
exports.EnergyBoost = EnergyBoost = __decorate([
    (0, typeorm_1.Entity)('energy_boosts')
], EnergyBoost);
//# sourceMappingURL=boost.entity.js.map