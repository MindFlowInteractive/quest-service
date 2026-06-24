import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { RegisterDeviceDto, UpdateDeviceDto } from './dto/device.dto';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  async register(dto: RegisterDeviceDto): Promise<Device> {
    this.logger.log(
      `Registering device for user ${dto.userId} (platform: ${dto.platform})`,
    );

    // Check if token already exists
    const existing = await this.deviceRepo.findOne({
      where: { token: dto.token },
    });

    if (existing) {
      // Update existing device with new user (token reassignment)
      existing.userId = dto.userId;
      existing.platform = dto.platform;
      existing.deviceModel = dto.deviceModel || existing.deviceModel;
      existing.osVersion = dto.osVersion || existing.osVersion;
      existing.appVersion = dto.appVersion || existing.appVersion;
      existing.isActive = true;
      existing.lastActiveAt = new Date();
      return this.deviceRepo.save(existing);
    }

    const device = this.deviceRepo.create({
      ...dto,
      isActive: true,
      lastActiveAt: new Date(),
    });

    return this.deviceRepo.save(device);
  }

  async update(id: string, dto: UpdateDeviceDto): Promise<Device> {
    const device = await this.deviceRepo.findOne({ where: { id } });

    if (!device) {
      throw new NotFoundException(`Device ${id} not found`);
    }

    if (dto.token) {
      const tokenExists = await this.deviceRepo.findOne({
        where: { token: dto.token },
      });
      if (tokenExists && tokenExists.id !== id) {
        throw new ConflictException('Token already registered to another device');
      }
    }

    Object.assign(device, dto);
    device.lastActiveAt = new Date();

    return this.deviceRepo.save(device);
  }

  async deactivate(id: string): Promise<void> {
    const device = await this.deviceRepo.findOne({ where: { id } });

    if (!device) {
      throw new NotFoundException(`Device ${id} not found`);
    }

    device.isActive = false;
    await this.deviceRepo.save(device);
  }

  async getByUser(userId: string): Promise<Device[]> {
    return this.deviceRepo.find({
      where: { userId, isActive: true },
      order: { lastActiveAt: 'DESC' },
    });
  }

  async getActiveTokensByUser(userId: string): Promise<string[]> {
    const devices = await this.getByUser(userId);
    return devices.map((d) => d.token);
  }

  async deactivateStaleTokens(tokens: string[]): Promise<number> {
    if (!tokens.length) return 0;

    const result = await this.deviceRepo
      .createQueryBuilder()
      .update(Device)
      .set({ isActive: false })
      .where('token IN (:...tokens)', { tokens })
      .execute();

    this.logger.log(`Deactivated ${result.affected || 0} stale device tokens`);
    return result.affected || 0;
  }

  async getActiveDevicesByIds(deviceIds: string[]): Promise<Device[]> {
    if (!deviceIds.length) return [];
    return this.deviceRepo.find({
      where: deviceIds.map((id) => ({ id, isActive: true })),
    });
  }

  async findAll(): Promise<Device[]> {
    return this.deviceRepo.find({ where: { isActive: true } });
  }
}
