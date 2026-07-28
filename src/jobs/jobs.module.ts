import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './job.entity';
import { JobsProcessor } from './jobs.processor';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    BullModule.registerQueue({
      name: 'jobs',
    }),
  ],
  providers: [JobsService, JobsProcessor],
  exports: [JobsService],
})
export class JobsModule {}
