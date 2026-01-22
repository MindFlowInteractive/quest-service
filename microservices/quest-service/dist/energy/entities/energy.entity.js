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
exports.UserEnergy = void 0;
const typeorm_1 = require("typeorm");
let UserEnergy = class UserEnergy {
    id;
    userId;
    currentEnergy;
    maxEnergy;
    lastRegenerationAt;
    regenerationRate;
    createdAt;
    updatedAt;
};
exports.UserEnergy = UserEnergy;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserEnergy.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserEnergy.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 100 }),
    __metadata("design:type", Number)
], UserEnergy.prototype, "currentEnergy", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 100 }),
    __metadata("design:type", Number)
], UserEnergy.prototype, "maxEnergy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UserEnergy.prototype, "lastRegenerationAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 300 }),
    __metadata("design:type", Number)
], UserEnergy.prototype, "regenerationRate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserEnergy.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserEnergy.prototype, "updatedAt", void 0);
exports.UserEnergy = UserEnergy = __decorate([
    (0, typeorm_1.Entity)('user_energy')
], UserEnergy);
//# sourceMappingURL=energy.entity.js.map