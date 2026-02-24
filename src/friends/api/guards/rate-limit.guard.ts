import { Injectable, CanActivate, ExecutionContext, BadRequestException, Inject } from '@nestjs/common';
import { Request } from 'express';
import { ICacheService } from '../../domain/repositories/repository-interfaces';

/**
 * Rate Limit Guard
 * Implements token bucket algorithm for rate limiting
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly defaultLimit = 100; // requests
  private readonly defaultWindow = 60; // seconds

  constructor(
    @Inject('ICacheService')
    private cacheService: ICacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user?.['sub'];

    if (!userId) {
      return true; // Let JWT guard handle auth
    }

    // Different limits per endpoint
    const endpoint = request.route?.path || '';
    const limit = this.getLimitForEndpoint(endpoint);

    const key = `ratelimit:${userId}:${endpoint}`;
    const current = await this.cacheService.get<number>(key);
    const count = (current || 0) + 1;

    if (count > limit) {
      throw new BadRequestException('Rate limit exceeded');
    }

    // Calculate TTL: reset at start of new time window
    const now = Math.floor(Date.now() / 1000);
    const windowStart = Math.floor(now / this.defaultWindow) * this.defaultWindow;
    const ttl = this.defaultWindow - (now - windowStart);

    await this.cacheService.set(key, count, ttl || 1);

    // Add rate limit headers
    request.res?.setHeader('X-RateLimit-Limit', limit);
    request.res?.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));
    request.res?.setHeader('X-RateLimit-Reset', new Date((windowStart + this.defaultWindow) * 1000).toISOString());

    return true;
  }

  private getLimitForEndpoint(endpoint: string): number {
    // Custom limits for high-volume endpoints
    if (endpoint.includes('/requests')) return 10; // Friend requests: 10/min
    if (endpoint.includes('/feed')) return 50; // Feed: 50/min
    if (endpoint.includes('/search')) return 30; // Search: 30/min
    if (endpoint.includes('/leaderboard')) return 50; // Leaderboard: 50/min
    return this.defaultLimit;
  }
}
