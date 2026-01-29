import { Injectable } from '@nestjs/common';
import { UserProgress } from '../entities/user-progress.entity';
import { checkMilestones } from './milestone.utils';

@Injectable()
export class MilestoneService {
  async detectMilestones(progress: UserProgress): Promise<string[]> {
    return checkMilestones(progress);
  }
}
