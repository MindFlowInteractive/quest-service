import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"
import { User } from "./entities/user.entity"
import { Role } from "./entities/role.entity"
import { RefreshToken } from "./entities/refresh-token.entity"
import { JwtStrategy } from "./strategies/jwt.strategy"
import { RefreshJwtStrategy } from "./strategies/refresh-jwt.strategy"
import { GoogleStrategy } from "./strategies/google.strategy"
import { jwtConstants } from "./constants"

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, RefreshToken]),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.accessExpiresIn },
    }),
  ],
  providers: [AuthService, JwtStrategy, RefreshJwtStrategy, GoogleStrategy],
  controllers: [AuthController],
  exports: [AuthService], // Export AuthService if other modules need to use it
})
export class AuthModule {}
