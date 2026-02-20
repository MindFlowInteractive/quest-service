import { Test, TestingModule } from '@nestjs/testing';
import {getRepositoryToken} from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardsService } from './rewards.service';
import { RewardCalculationService } from './reward-calculation.service';
import { SorobanTokenService } from './soroban-token.service';
import { RewardQueueService } from './reward-queue.service';
import { BatchRewardDistributionService } from './batch-reward-distribution.service';
import { TransactionSubmissionService } from './transaction-submission.service';
import { Reward } from './entities/reward.entity';

describe('RewardsService', () => {
  let service: RewardsService;
  let rewardRepository: Repository<Reward>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        RewardCalculationService,
        SorobanTokenService,
        RewardQueueService,
        BatchRewardDistributionService,
        TransactionSubmissionService,
        {
          provide: getRepositoryToken(Reward),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
    rewardRepository = module.get<Repository<Reward>>(getRepositoryToken(Reward));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handlePuzzleCompletion', () => {
    it('should calculate and schedule rewards for puzzle completion', async () => {
      // Mock the reward calculation service
      const mockRewardAmount = 25;
      jest.spyOn(service['rewardCalculationService'], 'calculatePuzzleReward')
        .mockResolvedValue(mockRewardAmount);

      // Mock the reward queue service
      jest.spyOn(service['rewardQueueService'], 'addToQueue')
        .mockResolvedValue(undefined);

      const result = await service.handlePuzzleCompletion(
        'user-id-123',
        'puzzle-id-456',
        120, // completion time in seconds
        1    // hints used
      );

      expect(result.success).toBe(true);
      expect(result.rewardAmount).toBe(mockRewardAmount);
      expect(service['rewardQueueService'].addToQueue).toHaveBeenCalledWith(
        'user-id-123',
        'token',
        mockRewardAmount,
        'puzzle-id-456',
        'normal'
      );
    });
  });

  describe('getUserRewards', () => {
    it('should return rewards for a specific user', async () => {
      const userId = 'user-id-123';
      const mockRewards: Reward[] = [
        {
          id: 'reward-1',
          userId,
          type: 'token',
          amount: 25,
          status: 'completed',
          reason: 'puzzle_completion',
          createdAt: new Date(),
        } as Reward,
      ];

      jest.spyOn(rewardRepository, 'find')
        .mockResolvedValue(mockRewards);

      const result = await service.getUserRewards(userId, {
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual(mockRewards);
      expect(rewardRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('claimReward', () => {
    it('should successfully claim a pending reward', async () => {
      const rewardId = 'reward-id-123';
      const userId = 'user-id-123';
      
      const mockReward: Reward = {
        id: rewardId,
        userId,
        type: 'token',
        amount: 25,
        status: 'pending',
        reason: 'puzzle_completion',
        createdAt: new Date(),
      } as Reward;

      jest.spyOn(rewardRepository, 'findOne')
        .mockResolvedValue(mockReward);

      jest.spyOn(rewardRepository, 'update')
        .mockResolvedValue(undefined);

      // Mock the distributeReward method to return success
      jest.spyOn(service as any, 'distributeReward')
        .mockResolvedValue({
          success: true,
          transactionHash: 'tx-hash-123',
        });

      const result = await service.claimReward(rewardId, 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('tx-hash-123');
    });
  });
});