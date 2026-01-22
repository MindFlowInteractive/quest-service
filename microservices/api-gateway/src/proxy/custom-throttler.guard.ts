import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    constructor(private configService: ConfigService) {
        super({
            ttl: configService.get<number>('rateLimit.ttl'),
            limit: configService.get<number>('rateLimit.limit'),
        });
    }

    protected async getTracker(req: Record<string, any>): Promise<string> {
        if (req.user?.sub) {
            return `user-${req.user.sub}`;
        }
        return req.ip;
    }

    protected async getLimit(context: ExecutionContext): Promise<number> {
        const request = context.switchToHttp().getRequest();

        if (request.user?.sub) {
            return this.configService.get<number>('rateLimit.limitAuthenticated');
        }

        return this.configService.get<number>('rateLimit.limit');
    }

    protected async handleRequest(
        context: ExecutionContext,
        limit: number,
        ttl: number,
    ): Promise<boolean> {
        const response = context.switchToHttp().getResponse();

        response.setHeader('X-RateLimit-Limit', limit);

        try {
            const result = await super.handleRequest(context, limit, ttl);
            response.setHeader('X-RateLimit-Remaining', limit - 1);
            return result;
        } catch (error) {
            response.setHeader('X-RateLimit-Remaining', 0);
            throw error;
        }
    }
}
