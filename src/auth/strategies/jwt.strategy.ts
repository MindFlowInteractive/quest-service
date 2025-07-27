import { Injectable } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { jwtConstants } from "../constants"
import type { JwtPayload } from "../interfaces/jwt-payload.interface"
import type { AuthService } from "../auth.service"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    })
  }

  async validate(payload: JwtPayload) {
    // You can fetch the user from the database here if needed,
    // but for basic validation, the payload is often enough.
    // Ensure the user still exists and is active.
    const user = await this.authService.validateUserById(payload.sub)
    if (!user) {
      // This will throw an UnauthorizedException
      return null
    }
    // Return the user object to be attached to the request (req.user)
    return { userId: payload.sub, email: payload.email, roles: payload.roles }
  }
}
