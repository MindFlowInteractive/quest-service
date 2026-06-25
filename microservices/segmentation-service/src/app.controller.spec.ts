import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get(AppController);
  });

  it('reports a healthy status', () => {
    const result = controller.health();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('segmentation-service');
    expect(typeof result.timestamp).toBe('string');
  });
});
