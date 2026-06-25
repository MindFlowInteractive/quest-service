import { Controller, Post, Body, Param, Delete, Get } from '@nestjs/common';
import { LicenseService } from './license.service';
import { License } from './entities/license.entity';

@Controller('licenses')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Post()
  async create(@Body() dto: { entitlements?: Record<string, any>; expiresAt?: string }): Promise<License> {
    const { entitlements, expiresAt } = dto;
    const expires = expiresAt ? new Date(expiresAt) : undefined;
    return this.licenseService.createLicense(entitlements, expires);
  }

  @Delete(':id')
  async revoke(@Param('id') id: string): Promise<License> {
    return this.licenseService.revokeLicense(id);
  }

  @Get(':key')
  async getByKey(@Param('key') key: string): Promise<License> {
    const license = await this.licenseService.findByKey(key);
    if (!license) {
      throw new NotFoundException('License not found');
    }
    return license;
  }
}
