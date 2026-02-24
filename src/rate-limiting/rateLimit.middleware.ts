import { Injectable, NestMiddleware } from '@nestjs/common';
import { RateLimitService } from './rateLimit.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly rateLimitService: RateLimitService) {}

  async use(req: any, res: any, next: () => void) {
    const user = req.user || null;
    const tier = user?.tier || 'free';
    const endpoint = req.path;
    const userId = user?.id || req.ip;

    // Admin bypass
    if (user?.role === 'admin') return next();

    const { allowed, remaining } = await this.rateLimitService.checkLimit(
      userId,
      endpoint,
      tier,
    );

    res.setHeader('X-RateLimit-Remaining', remaining);

    if (!allowed) {
      return res.status(429).json({
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        status: 429,
      });
    }

    next();
  }
}
