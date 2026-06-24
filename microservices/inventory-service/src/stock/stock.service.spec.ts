import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Stock } from './entities/stock.entity';
import { Repository } from 'typeorm';
import { InventoryService } from '../inventory/inventory.service';

describe('StockService', () => {
  let service: StockService;
  let repository: Repository<Stock>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockInventoryService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: getRepositoryToken(Stock),
          useValue: mockRepository,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    repository = module.get<Repository<Stock>>(getRepositoryToken(Stock));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});