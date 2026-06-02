import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MentorshipMilestone } from './entities/milestone.entity';
import { MilestoneProgress } from './entities/progress.entity';
import { RewardsService } from '../rewards/rewards.service';

@Injectable()
export class MilestonesService {
  constructor(
    @InjectRepository(MentorshipMilestone)
    private milestoneRepository: Repository<MentorshipMilestone>,
    @InjectRepository(MilestoneProgress)
    private progressRepository: Repository<MilestoneProgress>,
    private rewardsService: RewardsService,
  ) {}

  async createMilestone(mentorshipId: number, title: string, description: string, rewardAmount: number) {
    const milestone = this.milestoneRepository.create({
      mentorship: { id: mentorshipId } as any,
      title,
      description,
      rewardAmount,
    });
    return this.milestoneRepository.save(milestone);
  }

  async addProgress(milestoneId: number, updateMessage: string, progressPercentage: number) {
    const milestone = await this.milestoneRepository.findOne({ where: { id: milestoneId } });
    if (!milestone) throw new NotFoundException('Milestone not found');

    const progress = this.progressRepository.create({
      milestone,
      updateMessage,
      progressPercentage,
    });
    
    await this.progressRepository.save(progress);

    if (progressPercentage >= 100 && !milestone.isCompleted) {
      milestone.isCompleted = true;
      await this.milestoneRepository.save(milestone);
      
      // Load mentorship to get mentorId
      const m = await this.milestoneRepository.findOne({
        where: { id: milestoneId },
        relations: ['mentorship'],
      });

      if (m && m.mentorship) {
        await this.rewardsService.distributeReward(
          m.mentorship.mentorId,
          m.mentorship.id,
          milestone.rewardAmount,
          `Completed Milestone: ${milestone.title}`,
        );
      }
    }

    return progress;
  }

  async getMilestonesByMentorship(mentorshipId: number) {
    return this.milestoneRepository.find({
      where: { mentorship: { id: mentorshipId } as any },
      relations: ['progressUpdates'],
    });
  }
}
