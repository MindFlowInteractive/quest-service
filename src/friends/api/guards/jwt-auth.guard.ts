import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/**
 * JWT Authentication Guard
 * Validates JWT token from Authorization header
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7);

    // In production, verify JWT signature and expiry
    // For now, assume token is valid and contains user ID in 'sub' claim
    try {
      // Placeholder: In real implementation, verify with JwtService
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
