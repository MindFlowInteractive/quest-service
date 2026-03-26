import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Request } from "express"
import { jwtConstants } from "../constants"

@Injectable()
export class MfaPendingAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException("MFA pending token required")
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      })

      // Check if this is a valid MFA pending token
      if (!payload.isMfaPending || !payload.sub) {
        throw new UnauthorizedException("Invalid MFA pending token")
      }

      request["user"] = payload
      return true
    } catch {
      throw new UnauthorizedException("Invalid or expired MFA pending token")
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? []
    return type === "Bearer" ? token : undefined
  }
}
