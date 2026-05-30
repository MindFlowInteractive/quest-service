import { Module } from '@nestjs/common';
import { SlotModule } from './slot/slot.module';

@Module({
  imports: [SlotModule],
})
export class AppModule {}
