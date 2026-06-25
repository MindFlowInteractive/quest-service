import { Test, TestingModule } from '@nestjs/testing';
import { BackOrderService } from './back-order.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BackOrder, BackOrderStatus } from './entities/back-order.entity';
import { Repository } from 'typeorm';
import { StockService } from '../stock/stock.service';
import { InventoryService } from '../inventory/inventory.service';
import { Stock } from '../stock/entities/stock.entity';

describe('BackOrderService', () => {
  let service: BackOrderService;
  let repository: Repository<BackOrder>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockStockService = {
    getStockByInventory: jest.fn(),
  };

  const mockInventoryService = {
    findOne: jest.fn(),
  };

  const mockStockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackOrderService,
        {
          provide: getRepositoryToken(BackOrder),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Stock),
          useValue: mockStockRepository,
        },
        {
          provide: StockService,
          useValue: mockStockService,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    service = module.get<BackOrderService>(BackOrderService);
    repository = module.get<Repository<BackOrder>>(getRepositoryToken(BackOrder));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});