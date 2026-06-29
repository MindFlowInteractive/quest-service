import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Device } from '../entities/device.entity';

@Controller()
export class StaleTokenListener {
  private readonly logger = new Logger(StaleTokenListener.name);

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  @EventPattern('stale_tokens')
  async handleStaleTokens(@Payload() data: { tokens: string[] }) {
    if (!data.tokens?.length) return;

    try {
      const result = await this.deviceRepo.delete({ token: In(data.tokens) });
      this.logger.log(`Removed ${result.affected} stale device tokens: ${data.tokens.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to remove stale tokens: ${(error as Error).message}`, (error as Error).stack);
    }
  }
}
