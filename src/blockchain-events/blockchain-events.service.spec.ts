import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { of, throwError } from 'rxjs';

import { BlockchainEventsService } from './blockchain-events.service';
import { EventHandlersService } from './event-handlers.service';
import { OnChainEvent, OnChainEventType, EventProcessingStatus } from './entities/onchain-event.entity';
import { DeadLetterEvent } from './entities/dead-letter-event.entity';

describe('BlockchainEventsService', () => {
  let service: BlockchainEventsService;
  let onChainEventRepository: jest.Mocked<Repository<OnChainEvent>>;
  let deadLetterEventRepository: jest.Mocked<Repository<DeadLetterEvent>>;
  let eventHandlersService: jest.Mocked<EventHandlersService>;
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  const mockOnChainEvent: OnChainEvent = {
    id: 'test-id',
    contractAddress: 'test-contract',
    eventType: OnChainEventType.REWARD_CLAIMED,
    payload: { playerId: 'player1', amount: 100 },
    ledger: 12345,
    txHash: 'test-tx-hash',
    status: EventProcessingStatus.PROCESSED,
    processedAt: new Date(),
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    nextRetryAt: null,
    pagingToken: 'test-paging-token',
    network: 'testnet',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHorizonEvent = {
    id: 'horizon-event-id',
    paging_token: 'test-paging-token',
    ledger: 12346,
    created_at: '2023-01-01T00:00:00Z',
    transaction_hash: 'new-tx-hash',
    type: 'contract_event',
    contract_id: 'test-contract',
    topic: ['RewardClaimed'],
    value: {
      xdr: 'test-xdr-data',
    },
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainEventsService,
        {
          provide: getRepositoryToken(OnChainEvent),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(DeadLetterEvent),
          useValue: mockRepository,
        },
        {
          provide: EventHandlersService,
          useValue: {
            handleEvent: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'STELLAR_HORIZON_URL': 'https://horizon-testnet.stellar.org',
                'QUEST_CONTRACT_ADDRESSES': 'test-contract,another-contract',
                'STELLAR_NETWORK': 'testnet',
              };
              return config[key];
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlockchainEventsService>(BlockchainEventsService);
    onChainEventRepository = module.get(getRepositoryToken(OnChainEvent));
    deadLetterEventRepository = module.get(getRepositoryToken(DeadLetterEvent));
    eventHandlersService = module.get(EventHandlersService);
    configService = module.get(ConfigService);
    httpService = module.get(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('pollForEvents', () => {
    it('should poll events for all registered contracts', async () => {
      httpService.get.mockReturnValue(of({
        data: {
          _embedded: {
            records: [mockHorizonEvent],
          },
        },
      }));

      onChainEventRepository.findOne.mockResolvedValue(null);
      onChainEventRepository.create.mockReturnValue(mockOnChainEvent);
      onChainEventRepository.save.mockResolvedValue(mockOnChainEvent);
      eventHandlersService.handleEvent.mockResolvedValue(undefined);

      await service.pollForEvents();

      expect(httpService.get).toHaveBeenCalledTimes(2);
      expect(eventHandlersService.handleEvent).toHaveBeenCalled();
    });

    it('should skip already processed events', async () => {
      httpService.get.mockReturnValue(of({
        data: {
          _embedded: {
            records: [mockHorizonEvent],
          },
        },
      }));

      onChainEventRepository.findOne.mockResolvedValue(mockOnChainEvent);

      await service.pollForEvents();

      expect(eventHandlersService.handleEvent).not.toHaveBeenCalled();
    });

    it('should handle polling errors gracefully', async () => {
      httpService.get.mockReturnValue(throwError(() => new Error('Network error')));

      await service.pollForEvents();

      expect(httpService.get).toHaveBeenCalled();
    });
  });

  describe('processEvent', () => {
    it('should process new events successfully', async () => {
      onChainEventRepository.findOne.mockResolvedValue(null);
      onChainEventRepository.create.mockReturnValue(mockOnChainEvent);
      onChainEventRepository.save.mockResolvedValue(mockOnChainEvent);
      eventHandlersService.handleEvent.mockResolvedValue(undefined);

      await service['processEvent'](mockHorizonEvent, 'test-contract');

      expect(onChainEventRepository.create).toHaveBeenCalled();
      expect(eventHandlersService.handleEvent).toHaveBeenCalled();
      expect(onChainEventRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should move failed events to dead letter queue', async () => {
      onChainEventRepository.findOne.mockResolvedValue(null);
      onChainEventRepository.create.mockReturnValue(mockOnChainEvent);
      onChainEventRepository.save.mockResolvedValue(mockOnChainEvent);
      eventHandlersService.handleEvent.mockRejectedValue(new Error('Processing error'));

      await service['processEvent'](mockHorizonEvent, 'test-contract');

      expect(deadLetterEventRepository.create).toHaveBeenCalled();
      expect(deadLetterEventRepository.save).toHaveBeenCalled();
    });

    it('should skip unregistered event types', async () => {
      const unregisteredEvent = {
        ...mockHorizonEvent,
        topic: ['UnregisteredEvent'],
      };

      onChainEventRepository.findOne.mockResolvedValue(null);

      await service['processEvent'](unregisteredEvent, 'test-contract');

      expect(onChainEventRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status', async () => {
      onChainEventRepository.findOne.mockResolvedValue(mockOnChainEvent);
      onChainEventRepository.count.mockResolvedValue(10);
      deadLetterEventRepository.count.mockResolvedValue(2);

      const status = await service.getSyncStatus();

      expect(status).toEqual({
        lastSyncedLedger: 12345,
        eventsProcessedToday: 10,
        errorCount: 2,
        registeredContracts: ['test-contract', 'another-contract'],
      });
    });

    it('should handle no processed events', async () => {
      onChainEventRepository.findOne.mockResolvedValue(null);
      onChainEventRepository.count.mockResolvedValue(0);
      deadLetterEventRepository.count.mockResolvedValue(0);

      const status = await service.getSyncStatus();

      expect(status.lastSyncedLedger).toBe(0);
    });
  });

  describe('replayEvents', () => {
    it('should replay events from specified ledger range', async () => {
      const events = [mockOnChainEvent];
      onChainEventRepository.find.mockResolvedValue(events);
      eventHandlersService.handleEvent.mockResolvedValue(undefined);
      onChainEventRepository.save.mockResolvedValue(mockOnChainEvent);

      const result = await service.replayEvents(12345, 12350);

      expect(result).toEqual({ replayed: 1, errors: 0 });
      expect(onChainEventRepository.find).toHaveBeenCalled();
      expect(eventHandlersService.handleEvent).toHaveBeenCalled();
    });

    it('should handle replay errors', async () => {
      const events = [mockOnChainEvent];
      onChainEventRepository.find.mockResolvedValue(events);
      eventHandlersService.handleEvent.mockRejectedValue(new Error('Replay error'));

      const result = await service.replayEvents(12345);

      expect(result.errors).toBe(1);
    });

    it('should filter by ledger range when toLedger is provided', async () => {
      onChainEventRepository.find.mockResolvedValue([]);

      await service.replayEvents(12345, 12350);

      expect(onChainEventRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ledger: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('mapTopicToEventType', () => {
    it('should map known topics to event types', () => {
      expect(service['mapTopicToEventType'](['RewardClaimed'])).toBe(OnChainEventType.REWARD_CLAIMED);
      expect(service['mapTopicToEventType'](['AchievementUnlocked'])).toBe(OnChainEventType.ACHIEVEMENT_UNLOCKED);
      expect(service['mapTopicToEventType'](['NFTMinted'])).toBe(OnChainEventType.NFT_MINTED);
      expect(service['mapTopicToEventType'](['TournamentCompleted'])).toBe(OnChainEventType.TOURNAMENT_COMPLETED);
      expect(service['mapTopicToEventType'](['StakeDeposited'])).toBe(OnChainEventType.STAKE_DEPOSITED);
    });

    it('should return null for unknown topics', () => {
      expect(service['mapTopicToEventType'](['UnknownEvent'])).toBeNull();
    });
  });

  describe('parseEventValue', () => {
    it('should parse XDR value', () => {
      const result = service['parseEventValue']('test-xdr');

      expect(result).toHaveProperty('xdr', 'test-xdr');
      expect(result).toHaveProperty('parsed');
    });

    it('should handle XDR parsing errors', () => {
      const result = service['parseEventValue']('invalid-xdr');

      expect(result).toHaveProperty('xdr', 'invalid-xdr');
    });
  });
});
