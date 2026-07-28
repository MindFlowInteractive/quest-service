import { Module } from '@nestjs/common';

import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { RouterService } from './router/router.service';
import { RouteResolver } from './router/route-resolver';

@Module({
  controllers: [GatewayController],
  providers: [GatewayService, RouterService, RouteResolver],
  exports: [GatewayService, RouterService],
})
export class GatewayModule {}