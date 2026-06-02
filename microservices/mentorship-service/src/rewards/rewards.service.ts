import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorReward } from './entities/reward.entity';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(MentorReward)
    private rewardRepository: Repository<MentorReward>,
  ) {}

  async distributeReward(mentorId: string, mentorshipId: number, amount: number, reason: string) {
    const reward = this.rewardRepository.create({
      mentorId,
      mentorshipId,
      amount,
      reason,
    });
    return this.rewardRepository.save(reward);
  }

  async getRewardsByMentor(mentorId: string) {
    return this.rewardRepository.find({ where: { mentorId } });
  }
}
