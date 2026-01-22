import { Repository } from 'typeorm';
import { UserEnergy } from './entities/energy.entity';
export declare class EnergyNotificationService {
    private readonly energyRepository;
    private readonly logger;
    private client;
    constructor(energyRepository: Repository<UserEnergy>);
    checkFullEnergy(): Promise<void>;
}
