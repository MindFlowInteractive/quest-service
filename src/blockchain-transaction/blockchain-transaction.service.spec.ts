import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainTransactionService } from './blockchain-transaction.service';
import {
  BlockchainTransaction,
  TransactionStatus,
  TransactionType,
  TransactionCategory,
} from './entities/blockchain-transaction.entity';
import { HorizonApiService } from './services/horizon-api.service';
import { TransactionParserService } from './services/transaction-parser.service';

// Mock services
const mockHorizonApiService = {
  getTransaction: jest.fn(),
  getAccountTransactions: jest.fn(),
  getTransactionOperations: jest.fn(),
};

const mockTransactionParserService = {
  parseTransaction: jest.fn(),
  parseOperations: jest.fn(),
  categorizeTransaction: jest.fn(),
  extractUserId: jest.fn(),
};

describe('BlockchainTransactionService', () => {
  let service: BlockchainTransactionService;
  let repository: Repository<BlockchainTransaction>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainTransactionService,
        {
          provide: getRepositoryToken(BlockchainTransaction),
          useValue: mockRepository,
        },
        {
          provide: HorizonApiService,
          useValue: mockHorizonApiService,
        },
        {
          provide: TransactionParserService,
          useValue: mockTransactionParserService,
        },
      ],
    }).compile();

    service = module.get<BlockchainTransactionService>(BlockchainTransactionService);
    repository = module.get<Repository<BlockchainTransaction>>(
      getRepositoryToken(BlockchainTransaction)
    );

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const createDto = {
        transactionHash: 'abc123',
        type: TransactionType.TOKEN_PAYMENT,
        category: TransactionCategory.GAME_REWARD,
        sourceAccount: 'GABC...',
      };

      const expectedTransaction = {
        id: 'uuid',
        ...createDto,
        status: TransactionStatus.PENDING,
      };

      mockRepository.create.mockReturnValue(expectedTransaction);
      mockRepository.save.mockResolvedValue(expectedTransaction);

      const result = await service.create(createDto as any);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        status: TransactionStatus.PENDING,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedTransaction);
      expect(result).toEqual(expectedTransaction);
    });
  });

  describe('findByHash', () => {
    it('should return transaction by hash', async () => {
      const transaction = {
        id: 'uuid',
        transactionHash: 'abc123',
        status: TransactionStatus.CONFIRMED,
      };

      mockRepository.findOne.mockResolvedValue(transaction);

      const result = await service.findByHash('abc123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { transactionHash: 'abc123' },
      });
      expect(result).toEqual(transaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByHash('nonexistent')).rejects.toThrow(
        'Transaction with hash nonexistent not found'
      );
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status to confirmed', async () => {
      const transaction = {
        id: 'uuid',
        transactionHash: 'abc123',
        status: TransactionStatus.PENDING,
      };

      mockRepository.findOne.mockResolvedValue(transaction);
      mockRepository.save.mockResolvedValue({
        ...transaction,
        status: TransactionStatus.CONFIRMED,
        confirmedAt: expect.any(Date),
      });

      const result = await service.updateStatus('abc123', TransactionStatus.CONFIRMED);

      expect(result.status).toBe(TransactionStatus.CONFIRMED);
      expect(result.confirmedAt).toBeDefined();
    });

    it('should update transaction status to failed', async () => {
      const transaction = {
        id: 'uuid',
        transactionHash: 'abc123',
        status: TransactionStatus.PENDING,
      };

      mockRepository.findOne.mockResolvedValue(transaction);
      mockRepository.save.mockResolvedValue({
        ...transaction,
        status: TransactionStatus.FAILED,
        failedAt: expect.any(Date),
      });

      const result = await service.updateStatus('abc123', TransactionStatus.FAILED);

      expect(result.status).toBe(TransactionStatus.FAILED);
      expect(result.failedAt).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions with filters', async () => {
      const query = {
        status: TransactionStatus.CONFIRMED,
        type: TransactionType.TOKEN_PAYMENT,
        limit: 10,
        offset: 0,
      };

      const transactions = [
        { id: '1', transactionHash: 'abc123' },
        { id: '2', transactionHash: 'def456' },
      ];

      mockRepository.findAndCount.mockResolvedValue([transactions, 2]);

      const result = await service.findAll(query as any);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          status: TransactionStatus.CONFIRMED,
          type: TransactionType.TOKEN_PAYMENT,
        },
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 0,
      });
      expect(result.data).toEqual(transactions);
      expect(result.total).toBe(2);
    });
  });

  describe('syncAccountTransactions', () => {
    it('should sync transactions for an account', async () => {
      const accountId = 'GABC...';
      const horizonTx = {
        hash: 'abc123',
        successful: true,
        ledger: 12345,
      };

      mockHorizonApiService.getAccountTransactions.mockResolvedValue({
        _embedded: {
          records: [horizonTx],
        },
        _links: {},
      });

      mockHorizonApiService.getTransactionOperations.mockResolvedValue({
        _embedded: {
          records: [],
        },
      });

      mockRepository.findOne.mockResolvedValue(null);
      mockTransactionParserService.parseTransaction.mockReturnValue({
        transactionHash: 'abc123',
        sourceAccount: accountId,
      });
      mockTransactionParserService.parseOperations.mockReturnValue({
        transactionHash: 'abc123',
        type: TransactionType.TOKEN_PAYMENT,
      });
      mockTransactionParserService.categorizeTransaction.mockReturnValue(
        TransactionCategory.GAME_REWARD
      );
      mockTransactionParserService.extractUserId.mockReturnValue('user-uuid');
      mockRepository.save.mockResolvedValue({ id: 'uuid' });

      const result = await service.syncAccountTransactions(accountId);

      expect(result.count).toBe(1);
      expect(mockHorizonApiService.getAccountTransactions).toHaveBeenCalledWith(
        accountId,
        expect.any(Object)
      );
    });
  });

  describe('getCountByStatus', () => {
    it('should return transaction counts by status', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { status: 'confirmed', count: '10' },
          { status: 'pending', count: '5' },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getCountByStatus();

      expect(result.confirmed).toBe(10);
      expect(result.pending).toBe(5);
    });
  });
});
