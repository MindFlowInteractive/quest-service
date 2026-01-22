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
exports.EnergyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const energy_entity_1 = require("./entities/energy.entity");
const boost_entity_1 = require("./entities/boost.entity");
let EnergyService = class EnergyService {
    energyRepository;
    boostRepository;
    constructor(energyRepository, boostRepository) {
        this.energyRepository = energyRepository;
        this.boostRepository = boostRepository;
    }
    async getEnergyState(userId) {
        let energy = await this.energyRepository.findOne({ where: { userId } });
        if (!energy) {
            energy = this.energyRepository.create({
                userId,
                currentEnergy: 100,
                maxEnergy: 100,
                lastRegenerationAt: new Date(),
                regenerationRate: 300,
            });
            await this.energyRepository.save(energy);
        }
        return this.recalculateEnergy(energy);
    }
    async recalculateEnergy(energy) {
        const now = new Date();
        const secondsPassed = Math.floor((now.getTime() - energy.lastRegenerationAt.getTime()) / 1000);
        if (secondsPassed <= 0 || energy.currentEnergy >= energy.maxEnergy) {
            return energy;
        }
        const activeBoosts = await this.boostRepository.find({
            where: { userId: energy.userId, expiresAt: (0, typeorm_2.MoreThan)(now) },
        });
        let effectiveRegenRate = energy.regenerationRate;
        const regenBoost = activeBoosts.find(b => b.type === boost_entity_1.BoostType.REGEN_SPEED);
        if (regenBoost) {
            effectiveRegenRate /= regenBoost.multiplier;
        }
        const energyToGain = Math.floor(secondsPassed / effectiveRegenRate);
        if (energyToGain > 0) {
            energy.currentEnergy = Math.min(energy.maxEnergy, energy.currentEnergy + energyToGain);
            energy.lastRegenerationAt = new Date(energy.lastRegenerationAt.getTime() + energyToGain * effectiveRegenRate * 1000);
            await this.energyRepository.save(energy);
        }
        return energy;
    }
    async consumeEnergy(userId, amount) {
        const energy = await this.getEnergyState(userId);
        const activeBoosts = await this.boostRepository.find({
            where: { userId, expiresAt: (0, typeorm_2.MoreThan)(new Date()), type: boost_entity_1.BoostType.UNLIMITED },
        });
        if (activeBoosts.length > 0) {
            return energy;
        }
        if (energy.currentEnergy < amount) {
            throw new common_1.BadRequestException('Insufficient energy');
        }
        energy.currentEnergy -= amount;
        if (energy.currentEnergy + amount >= energy.maxEnergy) {
            energy.lastRegenerationAt = new Date();
        }
        return this.energyRepository.save(energy);
    }
    async refillEnergy(userId, amount) {
        const energy = await this.getEnergyState(userId);
        energy.currentEnergy = Math.min(energy.maxEnergy, energy.currentEnergy + amount);
        return this.energyRepository.save(energy);
    }
    async giftEnergy(fromUserId, toUserId, amount) {
        const senderEnergy = await this.getEnergyState(fromUserId);
        if (senderEnergy.currentEnergy < amount) {
            throw new common_1.BadRequestException('Insufficient energy to gift');
        }
        senderEnergy.currentEnergy -= amount;
        await this.energyRepository.save(senderEnergy);
        const receiverEnergy = await this.getEnergyState(toUserId);
        receiverEnergy.currentEnergy = Math.min(receiverEnergy.maxEnergy, receiverEnergy.currentEnergy + amount);
        await this.energyRepository.save(receiverEnergy);
    }
    async applyBoost(userId, type, multiplier, durationMinutes) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
        const boost = this.boostRepository.create({
            userId,
            type,
            multiplier,
            expiresAt,
        });
        return this.boostRepository.save(boost);
    }
};
exports.EnergyService = EnergyService;
exports.EnergyService = EnergyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(energy_entity_1.UserEnergy)),
    __param(1, (0, typeorm_1.InjectRepository)(boost_entity_1.EnergyBoost)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], EnergyService);
//# sourceMappingURL=energy.service.js.map