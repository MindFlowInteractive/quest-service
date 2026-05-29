import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkflowService } from './workflow.service';
import { Workflow, WorkflowStatus } from './workflow.entity';

describe('WorkflowService', () => {
  let service: WorkflowService;
  const mockRepo = {
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'uuid', retryCount: 0, ...d })),
    find: jest.fn(() => Promise.resolve([])),
    findOneBy: jest.fn(() => Promise.resolve({ id: 'uuid', name: 'test', retryCount: 0, status: WorkflowStatus.PENDING })),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkflowService,
        { provide: getRepositoryToken(Workflow), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(WorkflowService);
  });

  it('creates a workflow', async () => {
    const result = await service.create({ name: 'Test Workflow' });
    expect(result).toBeDefined();
  });

  it('executes a workflow', async () => {
    const result = await service.execute('uuid');
    expect(result.status).toBe(WorkflowStatus.RUNNING);
  });
});