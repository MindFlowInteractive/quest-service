import { Repository } from 'typeorm';
import { UserEnergy } from './entities/energy.entity';
import { EnergyBoost, BoostType } from './entities/boost.entity';
export declare class EnergyService {
    private readonly energyRepository;
    private readonly boostRepository;
    constructor(energyRepository: Repository<UserEnergy>, boostRepository: Repository<EnergyBoost>);
    getEnergyState(userId: string): Promise<UserEnergy>;
    private recalculateEnergy;
    consumeEnergy(userId: string, amount: number): Promise<UserEnergy>;
    refillEnergy(userId: string, amount: number): Promise<UserEnergy>;
    giftEnergy(fromUserId: string, toUserId: string, amount: number): Promise<void>;
    applyBoost(userId: string, type: BoostType, multiplier: number, durationMinutes: number): Promise<EnergyBoost>;
}
