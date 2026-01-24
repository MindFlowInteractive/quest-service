import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ABTestAssignment } from './entities/ab-test-assignment.entity';

@Injectable()
export class ABTestingService {
    constructor(
        @InjectRepository(ABTestAssignment)
        private abTestRepository: Repository<ABTestAssignment>,
    ) { }

    async getVariant(playerId: string, experimentName: string): Promise<string> {
        let assignment = await this.abTestRepository.findOne({
            where: { playerId, experimentName },
        });

        if (!assignment) {
            // Simple random assignment for illustration
            const variant = Math.random() > 0.5 ? 'B' : 'A';
            assignment = this.abTestRepository.create({
                playerId,
                experimentName,
                variant,
            });
            await this.abTestRepository.save(assignment);
        }

        return assignment.variant;
    }
}
