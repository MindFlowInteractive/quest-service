import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('CONFIG_API_KEY') || (this.config.get('NODE_ENV') === 'production' ? '' : 'dev-config-key');
    const supplied = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>().headers['x-config-api-key'] || '';
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    if (!expected || expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      throw new UnauthorizedException('A valid x-config-api-key header is required');
    }
    return true;
  }
}
