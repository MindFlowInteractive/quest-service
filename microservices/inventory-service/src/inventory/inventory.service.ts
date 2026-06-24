import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Inventory, ItemType, ItemStatus } from './entities/inventory.entity';
import { CreateInventoryDto, UpdateInventoryDto } from './dto/create-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const existing = await this.inventoryRepository.findOne({
      where: { sku: createInventoryDto.sku },
    });
    if (existing) {
      throw new ConflictException('SKU already exists');
    }

    const inventory = this.inventoryRepository.create({
      ...createInventoryDto,
      lowStockThreshold: createInventoryDto.lowStockThreshold || 0,
    });

    return this.inventoryRepository.save(inventory);
  }

  async findAll(options?: FindManyOptions<Inventory>): Promise<Inventory[]> {
    return this.inventoryRepository.find(options);
  }

  async findOne(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({ where: { id } });
    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }
    return inventory;
  }

  async findBySku(sku: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({ where: { sku } });
    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }
    return inventory;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    const inventory = await this.findOne(id);
    Object.assign(inventory, updateInventoryDto);
    return this.inventoryRepository.save(inventory);
  }

  async remove(id: string): Promise<void> {
    const inventory = await this.findOne(id);
    await this.inventoryRepository.remove(inventory);
  }

  async findByType(type: ItemType): Promise<Inventory[]> {
    return this.inventoryRepository.find({ where: { type } });
  }

  async findByStatus(status: ItemStatus): Promise<Inventory[]> {
    return this.inventoryRepository.find({ where: { status } });
  }
}