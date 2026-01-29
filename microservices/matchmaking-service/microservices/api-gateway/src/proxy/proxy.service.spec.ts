import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from './proxy.service';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { LoadBalancerService } from '../load-balancer/load-balancer.service';
import { RouteResolverService } from './route-resolver.service';

describe('ProxyService', () => {
  let service: ProxyService;
  let circuitBreaker: CircuitBreakerService;
  let loadBalancer: LoadBalancerService;
  let routeResolver: RouteResolverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: CircuitBreakerService,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: LoadBalancerService,
          useValue: {
            getNextInstance: jest.fn(),
          },
        },
        {
          provide: RouteResolverService,
          useValue: {
            resolveRoute: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    circuitBreaker = module.get<CircuitBreakerService>(CircuitBreakerService);
    loadBalancer = module.get<LoadBalancerService>(LoadBalancerService);
    routeResolver = module.get<RouteResolverService>(RouteResolverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('forwardRequest', () => {
    it('should throw NotFoundException when route not found', async () => {
      jest.spyOn(routeResolver, 'resolveRoute').mockReturnValue(null);

      const req = { path: '/unknown', method: 'GET' } as any;
      const res = {} as any;

      await expect(service.forwardRequest(req, res)).rejects.toThrow(
        'Service not found for this route',
      );
    });

    it('should throw BadGatewayException when no healthy instances', async () => {
      jest.spyOn(routeResolver, 'resolveRoute').mockReturnValue({
        serviceName: 'social',
        targetUrl: 'http://localhost:3001',
        targetPath: '/friends',
      });

      jest.spyOn(loadBalancer, 'getNextInstance').mockReturnValue(null);

      const req = { path: '/api/social/friends', method: 'GET' } as any;
      const res = {} as any;

      await expect(service.forwardRequest(req, res)).rejects.toThrow(
        'No healthy instances available',
      );
    });
  });
});
