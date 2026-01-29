import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { WsJwtAuthGuard } from './ws-jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [WsJwtAuthGuard],
  exports: [WsJwtAuthGuard],
})
export class AuthModule {}
