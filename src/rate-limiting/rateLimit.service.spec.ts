import { RateLimitService } from '../../src/rate-limiting/rateLimit.service';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redisMock: any;

  beforeEach(() => {
    redisMock = {
      zremrangebyscore: jest.fn(),
      zcard: jest.fn(),
      zadd: jest.fn(),
      expire: jest.fn(),
    };
    (Redis as any).mockImplementation(() => redisMock);
    service = new RateLimitService();
  });

  it('allows request under limit', async () => {
    redisMock.zcard.mockResolvedValue(0);
    const result = await service.checkLimit('user1', '/endpoint', 'free');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('blocks request over limit', async () => {
    redisMock.zcard.mockResolvedValue(100); // free tier limit
    const result = await service.checkLimit('user1', '/endpoint', 'free');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('applies premium tier correctly', async () => {
    redisMock.zcard.mockResolvedValue(500);
    const result = await service.checkLimit('user2', '/endpoint', 'premium');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThan(500);
  });
});
