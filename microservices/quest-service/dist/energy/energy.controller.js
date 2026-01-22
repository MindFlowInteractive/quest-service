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
exports.EnergyController = void 0;
const common_1 = require("@nestjs/common");
const energy_service_1 = require("./energy.service");
const energy_dto_1 = require("./energy.dto");
let EnergyController = class EnergyController {
    energyService;
    constructor(energyService) {
        this.energyService = energyService;
    }
    getEnergy(userId) {
        return this.energyService.getEnergyState(userId);
    }
    consumeEnergy(dto) {
        return this.energyService.consumeEnergy(dto.userId, dto.amount);
    }
    refillEnergy(dto) {
        return this.energyService.refillEnergy(dto.userId, dto.amount);
    }
    giftEnergy(dto) {
        return this.energyService.giftEnergy(dto.fromUserId, dto.toUserId, dto.amount);
    }
    applyBoost(dto) {
        return this.energyService.applyBoost(dto.userId, dto.type, dto.multiplier, dto.durationMinutes);
    }
};
exports.EnergyController = EnergyController;
__decorate([
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EnergyController.prototype, "getEnergy", null);
__decorate([
    (0, common_1.Post)('consume'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [energy_dto_1.ConsumeEnergyDto]),
    __metadata("design:returntype", void 0)
], EnergyController.prototype, "consumeEnergy", null);
__decorate([
    (0, common_1.Post)('refill'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [energy_dto_1.RefillEnergyDto]),
    __metadata("design:returntype", void 0)
], EnergyController.prototype, "refillEnergy", null);
__decorate([
    (0, common_1.Post)('gift'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [energy_dto_1.GiftEnergyDto]),
    __metadata("design:returntype", void 0)
], EnergyController.prototype, "giftEnergy", null);
__decorate([
    (0, common_1.Post)('boost'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [energy_dto_1.ApplyBoostDto]),
    __metadata("design:returntype", void 0)
], EnergyController.prototype, "applyBoost", null);
exports.EnergyController = EnergyController = __decorate([
    (0, common_1.Controller)('energy'),
    __metadata("design:paramtypes", [energy_service_1.EnergyService])
], EnergyController);
//# sourceMappingURL=energy.controller.js.map