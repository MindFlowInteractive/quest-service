import { EnergyService } from './energy.service';
import { ConsumeEnergyDto, RefillEnergyDto, GiftEnergyDto, ApplyBoostDto } from './energy.dto';
export declare class EnergyController {
    private readonly energyService;
    constructor(energyService: EnergyService);
    getEnergy(userId: string): Promise<import("./entities/energy.entity").UserEnergy>;
    consumeEnergy(dto: ConsumeEnergyDto): Promise<import("./entities/energy.entity").UserEnergy>;
    refillEnergy(dto: RefillEnergyDto): Promise<import("./entities/energy.entity").UserEnergy>;
    giftEnergy(dto: GiftEnergyDto): Promise<void>;
    applyBoost(dto: ApplyBoostDto): Promise<import("./entities/boost.entity").EnergyBoost>;
}
