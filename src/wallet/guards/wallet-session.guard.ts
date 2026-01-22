import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { WalletSession } from '../interfaces/wallet-session.interface';
import { WalletService } from '../wallet.service';

export interface WalletRequest extends Request {
  walletSession?: WalletSession;
}

@Injectable()
export class WalletSessionGuard implements CanActivate {
  constructor(private readonly walletService: WalletService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<WalletRequest>();
    const token = this.extractSessionToken(request);

    if (!token) {
      throw new UnauthorizedException('Wallet session token is required');
    }

    const session = this.walletService.getSession(token);
    request.walletSession = session;
    return true;
  }

  private extractSessionToken(request: Request): string | null {
    const headerToken = request.headers['x-wallet-session'];
    if (typeof headerToken === 'string' && headerToken.trim()) {
      return headerToken.trim();
    }

    const authHeader = request.headers['authorization'];
    if (typeof authHeader === 'string') {
      const [scheme, credentials] = authHeader.split(' ');
      if (scheme === 'Wallet' && credentials) {
        return credentials.trim();
      }
    }

    return null;
  }
}
