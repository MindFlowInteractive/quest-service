import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activation } from './entities/activation.entity';
import { License } from '../license/entities/license.entity';

@Injectable()
export class ActivationService {
  constructor(
    @InjectRepository(Activation)
    private readonly activationRepo: Repository<Activation>,
    @InjectRepository(License)
    private readonly licenseRepo: Repository<License>,
  ) {}

  async activate(key: string, deviceId: string): Promise<Activation> {
    const license = await this.licenseRepo.findOne({ where: { key } });
    if (!license) {
      throw new NotFoundException('License key not found');
    }
    if (license.revoked) {
      throw new BadRequestException('License has been revoked');
    }
    if (license.expiresAt && license.expiresAt < new Date()) {
      throw new BadRequestException('License has expired');
    }
    // Ensure one activation per device per license
    const existing = await this.activationRepo.findOne({ where: { license: { id: license.id }, deviceId } });
    if (existing) {
      return existing;
    }
    const activation = this.activationRepo.create({
      license,
      deviceId,
    });
    return this.activationRepo.save(activation);
  }
}
