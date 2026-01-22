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
exports.ApplyBoostDto = exports.GiftEnergyDto = exports.RefillEnergyDto = exports.ConsumeEnergyDto = void 0;
const class_validator_1 = require("class-validator");
const boost_entity_1 = require("./entities/boost.entity");
class ConsumeEnergyDto {
    userId;
    amount;
}
exports.ConsumeEnergyDto = ConsumeEnergyDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ConsumeEnergyDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ConsumeEnergyDto.prototype, "amount", void 0);
class RefillEnergyDto {
    userId;
    amount;
}
exports.RefillEnergyDto = RefillEnergyDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RefillEnergyDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RefillEnergyDto.prototype, "amount", void 0);
class GiftEnergyDto {
    fromUserId;
    toUserId;
    amount;
}
exports.GiftEnergyDto = GiftEnergyDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GiftEnergyDto.prototype, "fromUserId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GiftEnergyDto.prototype, "toUserId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GiftEnergyDto.prototype, "amount", void 0);
class ApplyBoostDto {
    userId;
    type;
    multiplier;
    durationMinutes;
}
exports.ApplyBoostDto = ApplyBoostDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ApplyBoostDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(boost_entity_1.BoostType),
    __metadata("design:type", String)
], ApplyBoostDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ApplyBoostDto.prototype, "multiplier", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ApplyBoostDto.prototype, "durationMinutes", void 0);
//# sourceMappingURL=energy.dto.js.map