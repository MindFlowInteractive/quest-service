import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RewardService } from './reward.service';
import { StellarService } from './stellar.service';
import { Reward } from '../entities/reward.entity';
import { ConfigService } from '@nestjs/config';
import { Keypair } from '@stellar/stellar-sdk';

describe('RewardService', () => {
  let service: RewardService;
  let mockRewardRepository: any;
  let mockStellarService: any;
  let mockConfigService: any;

  const validAddress = Keypair.random().publicKey();
  const validContractId = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4';

  beforeEach(async () => {
    mockRewardRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockStellarService = {
      invokeContract: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'REWARD_CONTRACT_ID') return validContractId;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardService,
        {
          provide: getRepositoryToken(Reward),
          useValue: mockRewardRepository,
        },
        {
          provide: StellarService,
          useValue: mockStellarService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RewardService>(RewardService);
  });

  describe('distributeTokenReward', () => {
    it('should create and save a pending reward before calling Stellar', async () => {
      const userId = validAddress;
      const amount = 100;
      const reason = 'test_reward';

      const mockReward = {
        id: '123',
        userId,
        type: 'token',
        amount,
        reason,
        status: 'pending',
      };

      mockRewardRepository.create.mockReturnValue(mockReward);
      mockRewardRepository.save
        .mockResolvedValueOnce(mockReward)
        .mockResolvedValueOnce({ ...mockReward, status: 'completed', transactionHash: 'tx123' });
      mockStellarService.invokeContract.mockResolvedValue({
        status: 'SUCCESS',
        hash: 'tx123',
      });

      const result = await service.distributeTokenReward(userId, amount, reason);

      expect(mockRewardRepository.create).toHaveBeenCalledWith({
        userId,
        type: 'token',
        amount,
        reason,
        status: 'pending',
      });

      expect(mockRewardRepository.save).toHaveBeenCalled();
      expect(result.status).toBe('completed');
      expect(result.transactionHash).toBe('tx123');
    });

    it('should handle Stellar contract errors gracefully', async () => {
      const userId = validAddress;
      const amount = 100;

      const mockReward = {
        id: '123',
        userId,
        type: 'token',
        amount,
        status: 'pending',
      };

      mockRewardRepository.create.mockReturnValue(mockReward);
      mockRewardRepository.save
        .mockResolvedValueOnce(mockReward)
        .mockResolvedValueOnce({ ...mockReward, status: 'failed', metadata: '{"error":"Contract error"}' });
      mockStellarService.invokeContract.mockRejectedValue(new Error('Contract error'));

      const result = await service.distributeTokenReward(userId, amount);

      expect(result.status).toBe('failed');
      expect(result.metadata).toContain('Contract error');
    });
  });

  describe('getRewardsByUser', () => {
    it('should return rewards for a user ordered by creation date', async () => {
      const userId = validAddress;
      const mockRewards = [
        { id: '1', userId, type: 'token', status: 'completed' },
        { id: '2', userId, type: 'nft', status: 'pending' },
      ];

      mockRewardRepository.find.mockResolvedValue(mockRewards);

      const result = await service.getRewardsByUser(userId);

      expect(mockRewardRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      expect(result).toEqual(mockRewards);
    });
  });

  describe('getRewardById', () => {
    it('should return a reward by ID', async () => {
      const mockReward = { id: '123', userId: validAddress, type: 'token' };
      mockRewardRepository.findOne.mockResolvedValue(mockReward);

      const result = await service.getRewardById('123');

      expect(result).toEqual(mockReward);
    });

    it('should throw NotFoundException if reward not found', async () => {
      mockRewardRepository.findOne.mockResolvedValue(null);

      await expect(service.getRewardById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserTokenBalance', () => {
    it('should fetch token balance from Stellar contract', async () => {
      const userAddress = validAddress;
      const mockBalance = { result: '1000000000' };

      mockStellarService.invokeContract.mockResolvedValue(mockBalance);

      const result = await service.getUserTokenBalance(userAddress);

      expect(mockStellarService.invokeContract).toHaveBeenCalledWith(
        validContractId,
        'get_user_rewards',
        expect.any(Array),
      );

      expect(result).toEqual('1000000000');
    });
  });

  describe('processScheduledRewards', () => {
    it('should retry pending rewards', async () => {
      const mockRewards = [
        { id: '1', userId: validAddress, type: 'token', amount: 100, status: 'pending' },
      ];

      mockRewardRepository.find.mockResolvedValue(mockRewards);
      mockStellarService.invokeContract.mockResolvedValue({
        status: 'SUCCESS',
        hash: 'tx123',
      });

      await service.processScheduledRewards();

      expect(mockRewardRepository.find).toHaveBeenCalledWith({
        where: { status: 'pending' },
      });

      expect(mockStellarService.invokeContract).toHaveBeenCalled();
    });
  });
});
