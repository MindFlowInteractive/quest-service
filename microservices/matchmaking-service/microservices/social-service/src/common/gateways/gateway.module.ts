import { Module } from '@nestjs/common';
import { SocialGateway } from './social.gateway';

@Module({
  providers: [SocialGateway],
  exports: [SocialGateway],
})
export class GatewayModule {}
