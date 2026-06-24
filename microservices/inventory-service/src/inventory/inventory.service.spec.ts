import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Inventory, ItemType, ItemStatus } from './entities/inventory.entity';
import { Repository } from 'typeorm';

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: Repository<Inventory>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Inventory),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    repository = module.get<Repository<Inventory>>(getRepositoryToken(Inventory));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an inventory item', async () => {
      const createDto = {
        sku: 'TEST-001',
        name: 'Test Item',
        description: 'Test Description',
        type: ItemType.MARKETPLACE,
        status: ItemStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createDto);
      mockRepository.save.mockResolvedValue({ id: 'test-id', ...createDto });

      const result = await service.create(createDto as any);
      expect(result.sku).toBe('TEST-001');
    });
  });
});