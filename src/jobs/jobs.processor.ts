import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job as BullJob } from 'bullmq';
import { Repository } from 'typeorm';
import { Job } from './job.entity';

@Processor('jobs')
export class JobsProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {
    super();
  }

  async process(job: BullJob<any, any, string>): Promise<any> {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}`,
    );
    await this.updateJobStatus(job.id, 'processing');

    try {
      if (job.name === 'flaky-job') {
        if (Math.random() > 0.5) {
          throw new Error('This job is flaky and has failed.');
        }
      }

      // Job processing logic goes here
      await this.updateJobStatus(job.id, 'completed');
    } catch (error) {
      await this.updateJobStatus(job.id, 'failed');
      throw error;
    }
  }

  private async updateJobStatus(id: string, status: string): Promise<void> {
    await this.jobRepository.update(id, { status });
  }
}
