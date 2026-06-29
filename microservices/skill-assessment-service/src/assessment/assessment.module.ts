import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { Assessment } from './entities/assessment.entity';
import { ReassessmentScheduler } from './reassessment.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment])],
  controllers: [AssessmentController],
  providers: [AssessmentService, ReassessmentScheduler],
  exports: [AssessmentService],
})
export class AssessmentModule {}
