import { RateLimitMiddleware } from '../../src/rate-limiting/rateLimit.middleware';
import { RateLimitService } from '../../src/rate-limiting/rateLimit.service';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let serviceMock: any;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    serviceMock = { checkLimit: jest.fn() };
    middleware = new RateLimitMiddleware(serviceMock as RateLimitService);

    req = { user: { id: 'user1', tier: 'free', role: 'user' }, path: '/endpoint', ip: '127.0.0.1' };
    res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('allows request when under limit', async () => {
    serviceMock.checkLimit.mockResolvedValue({ allowed: true, remaining: 5 });
    await middleware.use(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 5);
    expect(next).toHaveBeenCalled();
  });

  it('blocks request when over limit', async () => {
    serviceMock.checkLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    await middleware.use(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Rate limit exceeded. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      status: 429,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('bypasses admin user', async () => {
    req.user.role = 'admin';
    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(serviceMock.checkLimit).not.toHaveBeenCalled();
  });
});
