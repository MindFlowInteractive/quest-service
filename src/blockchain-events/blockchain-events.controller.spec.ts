import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainEventsController } from './blockchain-events.controller';
import { BlockchainEventsService } from './blockchain-events.service';

describe('BlockchainEventsController', () => {
  let controller: BlockchainEventsController;
  let service: jest.Mocked<BlockchainEventsService>;

  const mockSyncStatus = {
    lastSyncedLedger: 12345,
    eventsProcessedToday: 150,
    errorCount: 2,
    registeredContracts: ['contract1', 'contract2'],
  };

  const mockReplayResult = {
    replayed: 50,
    errors: 1,
  };

  beforeEach(async () => {
    const mockBlockchainEventsService = {
      getSyncStatus: jest.fn().mockResolvedValue(mockSyncStatus),
      replayEvents: jest.fn().mockResolvedValue(mockReplayResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockchainEventsController],
      providers: [
        {
          provide: BlockchainEventsService,
          useValue: mockBlockchainEventsService,
        },
      ],
    }).compile();

    controller = module.get<BlockchainEventsController>(BlockchainEventsController);
    service = module.get(BlockchainEventsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSyncStatus', () => {
    it('should return sync status', async () => {
      const result = await controller.getSyncStatus();

      expect(service.getSyncStatus).toHaveBeenCalled();
      expect(result).toEqual(mockSyncStatus);
    });

    it('should handle service errors', async () => {
      service.getSyncStatus.mockRejectedValue(new Error('Service error'));

      await expect(controller.getSyncStatus()).rejects.toThrow('Service error');
    });
  });

  describe('replayEvents', () => {
    it('should replay events with fromLedger only', async () => {
      const result = await controller.replayEvents(12345);

      expect(service.replayEvents).toHaveBeenCalledWith(12345, undefined);
      expect(result).toEqual(mockReplayResult);
    });

    it('should replay events with fromLedger and toLedger', async () => {
      const result = await controller.replayEvents(12345, 12350);

      expect(service.replayEvents).toHaveBeenCalledWith(12345, 12350);
      expect(result).toEqual(mockReplayResult);
    });

    it('should handle replay service errors', async () => {
      service.replayEvents.mockRejectedValue(new Error('Replay error'));

      await expect(controller.replayEvents(12345)).rejects.toThrow('Replay error');
    });

    it('should validate fromLedger parameter', async () => {
      await expect(controller.replayEvents(NaN)).rejects.toThrow();
    });

    it('should validate toLedger parameter if provided', async () => {
      await expect(controller.replayEvents(12345, NaN)).rejects.toThrow();
    });
  });
});
