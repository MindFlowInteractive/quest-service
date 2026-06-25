import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { License } from './entities/license.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LicenseService {
  constructor(
    @InjectRepository(License)
    private readonly licenseRepo: Repository<License>,
  ) {}

  async generateKey(): Promise<string> {
    // Simple UUID based key; in production could be more complex with checksum
    return uuidv4();
  }

  async createLicense(entitlements: Record<string, any> = {}, expiresAt?: Date): Promise<License> {
    const key = await this.generateKey();
    const license = this.licenseRepo.create({
      key,
      entitlements,
      expiresAt,
    });
    return this.licenseRepo.save(license);
  }

  async revokeLicense(id: string): Promise<License> {
    const license = await this.licenseRepo.findOneOrFail({ where: { id } });
    license.revoked = true;
    return this.licenseRepo.save(license);
  }

  async findByKey(key: string): Promise<License | undefined> {
    return this.licenseRepo.findOne({ where: { key } });
  }
}
