import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should return service info', () => {
    const result = appController.getInfo();
    expect(result.service).toBe('player-service');
    expect(result.status).toBe('ok');
  });

  it('should return healthy status', () => {
    const result = appController.getHealth();
    expect(result.status).toBe('healthy');
  });
});