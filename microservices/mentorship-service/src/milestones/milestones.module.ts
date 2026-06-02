import { Module } from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { MilestonesController } from './milestones.controller';

@Module({
  providers: [MilestonesService],
  controllers: [MilestonesController]
})
export class MilestonesModule {}
