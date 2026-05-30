import { Module } from '@nestjs/common';
import { SlotService } from './slot.service';
import { SlotController } from './slot.controller';
import { SeedService } from './seed.service';

@Module({
  providers: [SlotService, SeedService],
  controllers: [SlotController],
})
export class SlotModule {}
