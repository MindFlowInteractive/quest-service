import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventReward } from '../entities/event-reward.entity';
import { SeasonalEvent } from '../entities/seasonal-event.entity';
import { CreateRewardDto } from '../dto/create-reward.dto';

@Injectable()
export class EventRewardService {
  constructor(
    @InjectRepository(EventReward)
    private readonly rewardRepository: Repository<EventReward>,
    @InjectRepository(SeasonalEvent)
    private readonly eventRepository: Repository<SeasonalEvent>,
  ) {}

  /**
   * Create a new reward for an event
   */
  async createReward(createRewardDto: CreateRewardDto): Promise<EventReward> {
    // Verify event exists
    const event = await this.eventRepository.findOne({
      where: { id: createRewardDto.eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${createRewardDto.eventId} not found`);
    }

    const reward = this.rewardRepository.create(createRewardDto);
    return await this.rewardRepository.save(reward);
  }

  /**
   * Get all rewards for an event
   */
  async findRewardsByEvent(eventId: string): Promise<EventReward[]> {
    return await this.rewardRepository.find({
      where: { eventId },
      order: { displayOrder: 'ASC', requiredScore: 'ASC' },
    });
  }

  /**
   * Get active rewards for an event
   */
  async findActiveRewardsByEvent(eventId: string): Promise<EventReward[]> {
    return await this.rewardRepository.find({
      where: { eventId, isActive: true },
      order: { displayOrder: 'ASC', requiredScore: 'ASC' },
    });
  }

  /**
   * Get a single reward by ID
   */
  async findOne(rewardId: string): Promise<EventReward> {
    const reward = await this.rewardRepository.findOne({
      where: { id: rewardId },
      relations: ['event'],
    });

    if (!reward) {
      throw new NotFoundException(`Reward with ID ${rewardId} not found`);
    }

    return reward;
  }

  /**
   * Update a reward
   */
  async updateReward(
    rewardId: string,
    updateData: Partial<CreateRewardDto>,
  ): Promise<EventReward> {
    const reward = await this.findOne(rewardId);
    Object.assign(reward, updateData);
    return await this.rewardRepository.save(reward);
  }

  /**
   * Delete a reward
   */
  async deleteReward(rewardId: string): Promise<void> {
    const reward = await this.findOne(rewardId);
    await this.rewardRepository.remove(reward);
  }

  /**
   * Get rewards by type
   */
  async findRewardsByType(
    eventId: string,
    type: 'points' | 'badge' | 'item' | 'currency' | 'title' | 'avatar' | 'nft',
  ): Promise<EventReward[]> {
    return await this.rewardRepository.find({
      where: { eventId, type, isActive: true },
      order: { requiredScore: 'ASC' },
    });
  }

  /**
   * Get available rewards for a player based on their score
   */
  async getAvailableRewards(
    eventId: string,
    playerScore: number,
    playerPuzzlesCompleted: number,
  ): Promise<EventReward[]> {
    const allRewards = await this.findActiveRewardsByEvent(eventId);

    return allRewards.filter((reward) => {
      const meetsScoreRequirement = playerScore >= reward.requiredScore;
      const meetsPuzzleRequirement =
        !reward.requiredPuzzles || playerPuzzlesCompleted >= reward.requiredPuzzles;
      const notMaxedOut = !reward.maxClaims || reward.claimedCount < reward.maxClaims;

      return meetsScoreRequirement && meetsPuzzleRequirement && notMaxedOut;
    });
  }
}
