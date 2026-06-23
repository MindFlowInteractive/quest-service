import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExperimentService } from './experiment.service';
import { ExperimentController } from './experiment.controller';
import { Experiment } from '../entities/experiment.entity';
import { Variant } from '../entities/variant.entity';
import { Result } from '../entities/result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Experiment, Variant, Result])],
  providers: [ExperimentService],
  controllers: [ExperimentController],
  exports: [ExperimentService],
})
export class ExperimentModule {}
