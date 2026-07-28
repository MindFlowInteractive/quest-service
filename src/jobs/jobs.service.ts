import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job as BullJob, Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Job } from './job.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('jobs') private readonly jobsQueue: Queue,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  async addJob(
    name: string,
    data: any,
    opts?: {
      attempts?: number;
      backoff?: {
        type: 'exponential';
        delay: number;
      };
    },
  ): Promise<BullJob> {
    const job = await this.jobsQueue.add(name, data, opts);
    const jobEntity = this.jobRepository.create({
      id: job.id,
      name: job.name,
      data: job.data,
      status: 'waiting',
    });
    await this.jobRepository.save(jobEntity);
    return job;
  }

  async scheduleJob(
    name: string,
    data: any,
    date: Date,
    opts?: {
      attempts?: number;
      backoff?: {
        type: 'exponential';
        delay: number;
      };
    },
  ): Promise<BullJob> {
    const delay = date.getTime() - new Date().getTime();
    return this.addJob(name, data, { ...opts, delay });
  }

  async getJob(id: string): Promise<Job> {
    return this.jobRepository.findOne({ where: { id } });
  }
}
