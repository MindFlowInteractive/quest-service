import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Segment } from './entities/segment.entity';
import { Rule } from './entities/rule.entity';
import { Membership } from './entities/membership.entity';
import { SegmentEvent } from './entities/segment-event.entity';
import { AbAssignment, AbExperiment } from './entities/ab-experiment.entity';

import { SegmentationService } from './segmentation.service';
import {
  ExperimentController,
  EventController,
  SegmentationController,
} from './segmentation.controller';
import { SegmentationRuleEngineService } from './segmentation-rule-engine.service';
import { RedisCacheService } from './redis-cache.service';
import { SegmentationScheduler } from './segmentation.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Segment,
      Rule,
      Membership,
      SegmentEvent,
      AbExperiment,
      AbAssignment,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [SegmentationController, EventController, ExperimentController],
  providers: [
    SegmentationService,
    SegmentationRuleEngineService,
    RedisCacheService,
    SegmentationScheduler,
  ],
  exports: [SegmentationService],
})
export class SegmentationModule {}
