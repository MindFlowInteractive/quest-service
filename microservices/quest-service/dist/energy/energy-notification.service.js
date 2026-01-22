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
var EnergyNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnergyNotificationService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const energy_entity_1 = require("./entities/energy.entity");
const microservices_1 = require("@nestjs/microservices");
let EnergyNotificationService = EnergyNotificationService_1 = class EnergyNotificationService {
    energyRepository;
    logger = new common_1.Logger(EnergyNotificationService_1.name);
    client;
    constructor(energyRepository) {
        this.energyRepository = energyRepository;
        this.client = microservices_1.ClientProxyFactory.create({
            transport: microservices_1.Transport.TCP,
            options: {
                host: 'notification-service',
                port: 8888,
            },
        });
    }
    async checkFullEnergy() {
        this.logger.log('Checking for users with full energy...');
        const usersToNotify = await this.energyRepository.find({
            where: {
                currentEnergy: (0, typeorm_2.LessThan)(100),
            },
        });
        const now = new Date();
        for (const energy of usersToNotify) {
            const secondsNeeded = (energy.maxEnergy - energy.currentEnergy) * energy.regenerationRate;
            const fullAt = new Date(energy.lastRegenerationAt.getTime() + secondsNeeded * 1000);
            if (fullAt <= now) {
                this.logger.log(`Notifying user ${energy.userId} that energy is full`);
                this.client.emit('energy_full', { userId: energy.userId, message: 'Your energy is fully restored!' });
                energy.currentEnergy = energy.maxEnergy;
                energy.lastRegenerationAt = now;
                await this.energyRepository.save(energy);
            }
        }
    }
};
exports.EnergyNotificationService = EnergyNotificationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EnergyNotificationService.prototype, "checkFullEnergy", null);
exports.EnergyNotificationService = EnergyNotificationService = EnergyNotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(energy_entity_1.UserEnergy)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EnergyNotificationService);
//# sourceMappingURL=energy-notification.service.js.map