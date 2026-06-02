import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MilestonesService } from './milestones.service';
import { MilestonesController } from './milestones.controller';
import { MentorshipMilestone } from './entities/milestone.entity';
import { MilestoneProgress } from './entities/progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MentorshipMilestone, MilestoneProgress])],
  controllers: [MilestonesController],
  providers: [MilestonesService],
  exports: [MilestonesService],
})
export class MilestonesModule {}
