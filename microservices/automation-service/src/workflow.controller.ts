import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { Workflow } from './workflow.entity';

@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  create(@Body() body: Partial<Workflow>): Promise<Workflow> {
    return this.workflowService.create(body);
  }

  @Get()
  findAll(): Promise<Workflow[]> {
    return this.workflowService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Workflow | null> {
    return this.workflowService.findOne(id);
  }

  @Post(':id/execute')
  execute(@Param('id') id: string): Promise<Workflow> {
    return this.workflowService.execute(id);
  }

  @Post(':id/retry')
  retry(@Param('id') id: string): Promise<Workflow> {
    return this.workflowService.retry(id);
  }
}