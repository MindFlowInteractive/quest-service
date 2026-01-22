import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircuitBreakerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'circuitBreaker.timeout': 5000,
                'circuitBreaker.errorThresholdPercentage': 50,
                'circuitBreaker.resetTimeout': 30000,
                'circuitBreaker.volumeThreshold': 10,
                services: {
                  social: { url: 'http://localhost:3001' },
                  quest: { url: 'http://localhost:3002' },
                },
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize circuit breakers for all services', () => {
    service.onModuleInit();

    expect(service.getState('social')).toBeDefined();
    expect(service.getState('quest')).toBeDefined();
  });

  it('should return circuit breaker states', () => {
    service.onModuleInit();

    const states = service.getAllStates();
    expect(states).toHaveProperty('social');
    expect(states).toHaveProperty('quest');
  });
});
