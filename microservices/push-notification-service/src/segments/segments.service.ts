import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Segment } from './entities/segment.entity';
import { Device } from '../devices/entities/device.entity';
import { CreateSegmentDto, UpdateSegmentDto } from './dto/segment.dto';

@Injectable()
export class SegmentsService {
  private readonly logger = new Logger(SegmentsService.name);

  constructor(
    @InjectRepository(Segment)
    private readonly segmentRepo: Repository<Segment>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  async create(dto: CreateSegmentDto): Promise<Segment> {
    const segment = this.segmentRepo.create(dto);
    return this.segmentRepo.save(segment);
  }

  async findAll(): Promise<Segment[]> {
    return this.segmentRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Segment> {
    const segment = await this.segmentRepo.findOne({ where: { id } });
    if (!segment) {
      throw new NotFoundException(`Segment ${id} not found`);
    }
    return segment;
  }

  async update(id: string, dto: UpdateSegmentDto): Promise<Segment> {
    const segment = await this.findById(id);
    Object.assign(segment, dto);
    return this.segmentRepo.save(segment);
  }

  async remove(id: string): Promise<void> {
    const segment = await this.findById(id);
    await this.segmentRepo.remove(segment);
  }

  async resolveDevices(segmentId: string): Promise<Device[]> {
    const segment = await this.findById(segmentId);

    if (!segment.isActive) {
      this.logger.warn(`Segment ${segmentId} is inactive`);
      return [];
    }

    const queryBuilder = this.deviceRepo
      .createQueryBuilder('device')
      .where('device.isActive = :isActive', { isActive: true });

    const criteria = segment.criteria;

    if (criteria.platform) {
      queryBuilder.andWhere('device.platform = :platform', {
        platform: criteria.platform,
      });
    }

    if (criteria.appVersion) {
      queryBuilder.andWhere('device.appVersion = :appVersion', {
        appVersion: criteria.appVersion,
      });
    }

    if (criteria.osVersion) {
      queryBuilder.andWhere('device.osVersion = :osVersion', {
        osVersion: criteria.osVersion,
      });
    }

    if (criteria.userIds && Array.isArray(criteria.userIds)) {
      queryBuilder.andWhere('device.userId IN (:...userIds)', {
        userIds: criteria.userIds,
      });
    }

    const devices = await queryBuilder.getMany();

    this.logger.log(
      `Segment ${segmentId} resolved to ${devices.length} devices`,
    );

    return devices;
  }
}
