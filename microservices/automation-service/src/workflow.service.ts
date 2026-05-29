import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow, WorkflowStatus } from './workflow.entity';

const MAX_RETRIES = 3;

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepo: Repository<Workflow>,
  ) {}

  create(data: Partial<Workflow>): Promise<Workflow> {
    return this.workflowRepo.save(this.workflowRepo.create(data));
  }

  findAll(): Promise<Workflow[]> {
    return this.workflowRepo.find();
  }

  findOne(id: string): Promise<Workflow | null> {
    return this.workflowRepo.findOneBy({ id });
  }

  async execute(id: string): Promise<Workflow> {
    const workflow = await this.workflowRepo.findOneBy({ id });
    if (!workflow) throw new Error(`Workflow ${id} not found`);
    workflow.status = WorkflowStatus.RUNNING;
    return this.workflowRepo.save(workflow);
  }

  async retry(id: string): Promise<Workflow> {
    const workflow = await this.workflowRepo.findOneBy({ id });
    if (!workflow) throw new Error(`Workflow ${id} not found`);
    if (workflow.retryCount >= MAX_RETRIES) {
      workflow.status = WorkflowStatus.FAILED;
    } else {
      workflow.retryCount += 1;
      workflow.status = WorkflowStatus.PENDING;
    }
    return this.workflowRepo.save(workflow);
  }
}