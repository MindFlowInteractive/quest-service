import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExperimentsService } from './experiments.service';
import { AbTestingController } from './ab-testing.controller';
import { Experiment } from './entities/experiment.entity';
import { ExperimentConversion } from './entities/experiment-conversion.entity';
import { FeatureFlag } from './entities/feature-flag.entity';
import { ExperimentAssignment } from './entities/experiment-assignment.entity';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Experiment,
      ExperimentConversion,
      FeatureFlag,
      ExperimentAssignment,
    ]),
  ],
  controllers: [AbTestingController],
  providers: [ExperimentsService, AdminGuard],
  exports: [ExperimentsService], // export so other modules can inject it
})
export class AbTestingModule {}