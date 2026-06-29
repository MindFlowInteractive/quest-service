import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { Report, ReportFormat } from './report.entity';

describe('ReportService', () => {
  let service: ReportService;
  const mockRepo = {
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'uuid', ...d })),
    find: jest.fn(() => Promise.resolve([])),
    findOneBy: jest.fn(() => Promise.resolve({ id: 'uuid', name: 'test', query: {}, format: ReportFormat.JSON })),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: getRepositoryToken(Report), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(ReportService);
  });

  it('creates a report', async () => {
    const result = await service.create({ name: 'Monthly Report' });
    expect(result).toBeDefined();
  });

  it('exports a report as JSON', async () => {
    const result = await service.export('uuid', ReportFormat.JSON);
    expect(result.format).toBe(ReportFormat.JSON);
  });
});