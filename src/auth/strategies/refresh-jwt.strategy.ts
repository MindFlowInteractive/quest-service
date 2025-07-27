import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { jwtConstants } from "../constants"
import type { AuthService } from "../auth.service"
import type { Request } from "express"

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, "refresh-jwt") {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField("refreshToken"), // Expect refresh token in request body
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
      passReqToCallback: true, // Pass the request to the validate method
    })
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.body.refreshToken
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not provided.")
    }

    const isValidToken = await this.authService.validateRefreshToken(payload.sub, refreshToken)
    if (!isValidToken) {
      throw new UnauthorizedException("Invalid or revoked refresh token.")
    }

    // Return the user object to be attached to the request (req.user)
    return { userId: payload.sub, email: payload.email, roles: payload.roles }
  }
}
