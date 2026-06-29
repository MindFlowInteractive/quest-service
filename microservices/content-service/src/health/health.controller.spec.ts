import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthController } from './health.controller';
import { Content } from '../entities/content.entity';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getRepositoryToken(Content),
          useValue: {
            query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          } satisfies Partial<Repository<Content>>,
        },
      ],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('root() returns service metadata', () => {
    const result = controller.root();
    expect(result.service).toBe('content-service');
    expect(result.endpoints).toBeDefined();
  });

  it('check() reports ok when db check passes', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(result.checks.database).toBe(true);
  });
});

