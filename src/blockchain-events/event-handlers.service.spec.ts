import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EventHandlersService } from './event-handlers.service';
import { OnChainEvent, OnChainEventType } from './entities/onchain-event.entity';

describe('EventHandlersService', () => {
  let service: EventHandlersService;
  let onChainEventRepository: jest.Mocked<Repository<OnChainEvent>>;

  const mockRewardClaimedEvent: OnChainEvent = {
    id: 'reward-event-id',
    contractAddress: 'quest-contract',
    eventType: OnChainEventType.REWARD_CLAIMED,
    payload: {
      playerId: 'player123',
      rewardType: 'tokens',
      amount: 100,
      timestamp: 1640995200,
    },
    ledger: 12345,
    txHash: 'reward-tx-hash',
    status: 'pending' as any,
    processedAt: null,
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    nextRetryAt: null,
    pagingToken: 'paging-token',
    network: 'testnet',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAchievementUnlockedEvent: OnChainEvent = {
    ...mockRewardClaimedEvent,
    id: 'achievement-event-id',
    eventType: OnChainEventType.ACHIEVEMENT_UNLOCKED,
    txHash: 'achievement-tx-hash',
    payload: {
      playerId: 'player123',
      achievementId: 'first_win',
      achievementType: 'milestone',
      timestamp: 1640995200,
    },
  };

  const mockNFTMintedEvent: OnChainEvent = {
    ...mockRewardClaimedEvent,
    id: 'nft-event-id',
    eventType: OnChainEventType.NFT_MINTED,
    txHash: 'nft-tx-hash',
    payload: {
      playerId: 'player123',
      tokenId: 'nft-token-123',
      contractAddress: 'nft-contract',
      metadata: { name: 'Victory Badge', rarity: 'common' },
      timestamp: 1640995200,
    },
  };

  const mockTournamentCompletedEvent: OnChainEvent = {
    ...mockRewardClaimedEvent,
    id: 'tournament-event-id',
    eventType: OnChainEventType.TOURNAMENT_COMPLETED,
    txHash: 'tournament-tx-hash',
    payload: {
      tournamentId: 'tournament-456',
      playerId: 'player123',
      finalRank: 1,
      prizeAmount: 500,
      timestamp: 1640995200,
    },
  };

  const mockStakeDepositedEvent: OnChainEvent = {
    ...mockRewardClaimedEvent,
    id: 'stake-event-id',
    eventType: OnChainEventType.STAKE_DEPOSITED,
    txHash: 'stake-tx-hash',
    payload: {
      playerId: 'player123',
      amount: 1000,
      tokenAddress: 'token-contract',
      lockPeriod: 30,
      timestamp: 1640995200,
    },
  };

  beforeEach(async () => {
    const mockRepository = {
      save: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventHandlersService,
        {
          provide: getRepositoryToken(OnChainEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EventHandlersService>(EventHandlersService);
    onChainEventRepository = module.get(getRepositoryToken(OnChainEvent));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleEvent', () => {
    it('should handle RewardClaimed events', async () => {
      const updatePlayerBalanceSpy = jest.spyOn(service as any, 'updatePlayerBalanceCache');
      const logRewardTransactionSpy = jest.spyOn(service as any, 'logRewardTransaction');
      const triggerRewardNotificationSpy = jest.spyOn(service as any, 'triggerRewardNotification');

      await service.handleEvent(mockRewardClaimedEvent);

      expect(updatePlayerBalanceSpy).toHaveBeenCalledWith('player123', 100, 'tokens');
      expect(logRewardTransactionSpy).toHaveBeenCalledWith(mockRewardClaimedEvent.payload);
      expect(triggerRewardNotificationSpy).toHaveBeenCalledWith(mockRewardClaimedEvent.payload);
    });

    it('should handle AchievementUnlocked events', async () => {
      const updatePlayerAchievementsSpy = jest.spyOn(service as any, 'updatePlayerAchievements');
      const unlockAchievementRewardsSpy = jest.spyOn(service as any, 'unlockAchievementRewards');
      const triggerAchievementNotificationSpy = jest.spyOn(service as any, 'triggerAchievementNotification');

      await service.handleEvent(mockAchievementUnlockedEvent);

      expect(updatePlayerAchievementsSpy).toHaveBeenCalledWith('player123', 'first_win');
      expect(unlockAchievementRewardsSpy).toHaveBeenCalledWith(mockAchievementUnlockedEvent.payload);
      expect(triggerAchievementNotificationSpy).toHaveBeenCalledWith(mockAchievementUnlockedEvent.payload);
    });

    it('should handle NFTMinted events', async () => {
      const updateNFTOwnershipSpy = jest.spyOn(service as any, 'updateNFTOwnership');
      const indexNFTMetadataSpy = jest.spyOn(service as any, 'indexNFTMetadata');
      const triggerNFTMintNotificationSpy = jest.spyOn(service as any, 'triggerNFTMintNotification');

      await service.handleEvent(mockNFTMintedEvent);

      expect(updateNFTOwnershipSpy).toHaveBeenCalledWith('player123', 'nft-token-123', 'nft-contract');
      expect(indexNFTMetadataSpy).toHaveBeenCalledWith('nft-token-123', { name: 'Victory Badge', rarity: 'common' });
      expect(triggerNFTMintNotificationSpy).toHaveBeenCalledWith(mockNFTMintedEvent.payload);
    });

    it('should handle TournamentCompleted events', async () => {
      const updateTournamentResultsSpy = jest.spyOn(service as any, 'updateTournamentResults');
      const distributeTournamentPrizesSpy = jest.spyOn(service as any, 'distributeTournamentPrizes');
      const updatePlayerRankingsSpy = jest.spyOn(service as any, 'updatePlayerRankings');
      const triggerTournamentCompletionNotificationSpy = jest.spyOn(service as any, 'triggerTournamentCompletionNotification');

      await service.handleEvent(mockTournamentCompletedEvent);

      expect(updateTournamentResultsSpy).toHaveBeenCalledWith(mockTournamentCompletedEvent.payload);
      expect(distributeTournamentPrizesSpy).toHaveBeenCalledWith(mockTournamentCompletedEvent.payload);
      expect(updatePlayerRankingsSpy).toHaveBeenCalledWith(mockTournamentCompletedEvent.payload);
      expect(triggerTournamentCompletionNotificationSpy).toHaveBeenCalledWith(mockTournamentCompletedEvent.payload);
    });

    it('should handle StakeDeposited events', async () => {
      const updatePlayerStakeBalanceSpy = jest.spyOn(service as any, 'updatePlayerStakeBalance');
      const recordStakingTransactionSpy = jest.spyOn(service as any, 'recordStakingTransaction');
      const calculateStakingRewardsSpy = jest.spyOn(service as any, 'calculateStakingRewards');
      const triggerStakeNotificationSpy = jest.spyOn(service as any, 'triggerStakeNotification');

      await service.handleEvent(mockStakeDepositedEvent);

      expect(updatePlayerStakeBalanceSpy).toHaveBeenCalledWith('player123', 1000, 'token-contract');
      expect(recordStakingTransactionSpy).toHaveBeenCalledWith(mockStakeDepositedEvent.payload);
      expect(calculateStakingRewardsSpy).toHaveBeenCalledWith(mockStakeDepositedEvent.payload);
      expect(triggerStakeNotificationSpy).toHaveBeenCalledWith(mockStakeDepositedEvent.payload);
    });

    it('should throw error for unknown event types', async () => {
      const unknownEvent = {
        ...mockRewardClaimedEvent,
        eventType: 'UnknownEvent' as any,
      };

      await expect(service.handleEvent(unknownEvent)).rejects.toThrow('Unsupported event type: UnknownEvent');
    });

    it('should propagate handler errors', async () => {
      jest.spyOn(service as any, 'updatePlayerBalanceCache').mockRejectedValue(new Error('Handler error'));

      await expect(service.handleEvent(mockRewardClaimedEvent)).rejects.toThrow('Handler error');
    });
  });

  describe('RewardClaimed handlers', () => {
    it('should update player balance cache', async () => {
      const spy = jest.spyOn(service as any, 'updatePlayerBalanceCache');
      spy.mockImplementation(() => Promise.resolve());

      await service['updatePlayerBalanceCache']('player123', 100, 'tokens');

      expect(spy).toHaveBeenCalledWith('player123', 100, 'tokens');
    });

    it('should log reward transaction', async () => {
      const spy = jest.spyOn(service as any, 'logRewardTransaction');
      spy.mockImplementation(() => Promise.resolve());

      await service['logRewardTransaction'](mockRewardClaimedEvent.payload);

      expect(spy).toHaveBeenCalledWith(mockRewardClaimedEvent.payload);
    });

    it('should trigger reward notification', async () => {
      const spy = jest.spyOn(service as any, 'triggerRewardNotification');
      spy.mockImplementation(() => Promise.resolve());

      await service['triggerRewardNotification'](mockRewardClaimedEvent.payload);

      expect(spy).toHaveBeenCalledWith(mockRewardClaimedEvent.payload);
    });
  });

  describe('AchievementUnlocked handlers', () => {
    it('should update player achievements', async () => {
      const spy = jest.spyOn(service as any, 'updatePlayerAchievements');
      spy.mockImplementation(() => Promise.resolve());

      await service['updatePlayerAchievements']('player123', 'first_win');

      expect(spy).toHaveBeenCalledWith('player123', 'first_win');
    });

    it('should unlock achievement rewards', async () => {
      const spy = jest.spyOn(service as any, 'unlockAchievementRewards');
      spy.mockImplementation(() => Promise.resolve());

      await service['unlockAchievementRewards'](mockAchievementUnlockedEvent.payload);

      expect(spy).toHaveBeenCalledWith(mockAchievementUnlockedEvent.payload);
    });

    it('should trigger achievement notification', async () => {
      const spy = jest.spyOn(service as any, 'triggerAchievementNotification');
      spy.mockImplementation(() => Promise.resolve());

      await service['triggerAchievementNotification'](mockAchievementUnlockedEvent.payload);

      expect(spy).toHaveBeenCalledWith(mockAchievementUnlockedEvent.payload);
    });
  });

  describe('NFTMinted handlers', () => {
    it('should update NFT ownership', async () => {
      const spy = jest.spyOn(service as any, 'updateNFTOwnership');
      spy.mockImplementation(() => Promise.resolve());

      await service['updateNFTOwnership']('player123', 'nft-token-123', 'nft-contract');

      expect(spy).toHaveBeenCalledWith('player123', 'nft-token-123', 'nft-contract');
    });

    it('should index NFT metadata', async () => {
      const spy = jest.spyOn(service as any, 'indexNFTMetadata');
      spy.mockImplementation(() => Promise.resolve());

      await service['indexNFTMetadata']('nft-token-123', { name: 'Victory Badge' });

      expect(spy).toHaveBeenCalledWith('nft-token-123', { name: 'Victory Badge' });
    });

    it('should trigger NFT mint notification', async () => {
      const spy = jest.spyOn(service as any, 'triggerNFTMintNotification');
      spy.mockImplementation(() => Promise.resolve());

      await service['triggerNFTMintNotification'](mockNFTMintedEvent.payload);

      expect(spy).toHaveBeenCalledWith(mockNFTMintedEvent.payload);
    });
  });

  describe('TournamentCompleted handlers', () => {
    it('should update tournament results', async () => {
      const spy = jest.spyOn(service as any, 'updateTournamentResults');
      spy.mockImplementation(() => Promise.resolve());

      await service['updateTournamentResults'](mockTournamentCompletedEvent.payload);

      expect(spy).toHaveBeenCalledWith(mockTournamentCompletedEvent.payload);
    });

    it('should distribute tournament prizes', async () => {
      const spy = jest.spyOn(service as any, 'distributeTournamentPrizes');
      spy.mockImplementation(() => Promise.resolve());

      await service['distributeTournamentPrizes'](mockTournamentCompletedEvent.payload);

      expect(spy).toHaveBeenCalledWith(mockTournamentCompletedEvent.payload);
    });

    it('should update player rankings', async () => {
      const spy = jest.spyOn(service as any, 'updatePlayerRankings');
      spy.mockImplementation(() => Promise.resolve());

      await service['updatePlayerRankings'](mockTournamentCompletedEvent.payload);

      expect(spy).toHaveBeenCalledWith(mockTournamentCompletedEvent.payload);
    });

    it('should trigger tournament completion notification', async () => {
      const spy = jest.spyOn(service as any, 'triggerTournamentCompletionNotification');
      spy.mockImplementation(() => Promise.resolve());

      await service['triggerTournamentCompletionNotification'](mockTournamentCompletedEvent.payload);

      expect(spy).toHaveBeenCalledWith(mockTournamentCompletedEvent.payload);
    });
  });

  describe('StakeDeposited handlers', () => {
    it('should update player stake balance', async () => {
      const spy = jest.spyOn(service as any, 'updatePlayerStakeBalance');
      spy.mockImplementation(() => Promise.resolve());

      await service['updatePlayerStakeBalance']('player123', 1000, 'token-contract');

      expect(spy).toHaveBeenCalledWith('player123', 1000, 'token-contract');
    });

    it('should record staking transaction', async () => {
      const spy = jest.spyOn(service as any, 'recordStakingTransaction');
      spy.mockImplementation(() => Promise.resolve());

      await service['recordStakingTransaction'](mockStakeDepositedEvent.payload);

      expect(spy).toHaveBeenCalledWith(mockStakeDepositedEvent.payload);
    });

    it('should calculate staking rewards', async () => {
      const spy = jest.spyOn(service as any, 'calculateStakingRewards');
      spy.mockImplementation(() => Promise.resolve());

      await service['calculateStakingRewards'](mockStakeDepositedEvent.payload);

      expect(spy).toHaveBeenCalledWith(mockStakeDepositedEvent.payload);
    });

    it('should trigger stake notification', async () => {
      const spy = jest.spyOn(service as any, 'triggerStakeNotification');
      spy.mockImplementation(() => Promise.resolve());

      await service['triggerStakeNotification'](mockStakeDepositedEvent.payload);

      expect(spy).toHaveBeenCalledWith(mockStakeDepositedEvent.payload);
    });
  });
});
