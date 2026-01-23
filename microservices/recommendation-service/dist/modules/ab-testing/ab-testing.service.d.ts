import { Repository } from 'typeorm';
import { ABTestAssignment } from './entities/ab-test-assignment.entity';
export declare class ABTestingService {
    private abTestRepository;
    constructor(abTestRepository: Repository<ABTestAssignment>);
    getVariant(playerId: string, experimentName: string): Promise<string>;
}
