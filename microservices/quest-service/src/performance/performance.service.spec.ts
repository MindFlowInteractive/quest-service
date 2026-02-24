import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceService } from './performance.service';

describe('PerformanceService', () => {
  let service: PerformanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PerformanceService],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should record API response time', () => {
    expect(() => {
      service.recordApiResponseTime('GET', '/test', 200, 100);
    }).not.toThrow();
  });

  it('should record database query time', () => {
    expect(() => {
      service.recordDbQueryTime('SELECT', 'users', true, 50);
    }).not.toThrow();
  });

  it('should detect memory leaks', () => {
    const result = service.detectMemoryLeak();
    expect(typeof result).toBe('boolean');
  });

  it('should increment and decrement active requests', () => {
    expect(() => {
      service.incrementActiveRequests();
      service.decrementActiveRequests();
    }).not.toThrow();
  });
});