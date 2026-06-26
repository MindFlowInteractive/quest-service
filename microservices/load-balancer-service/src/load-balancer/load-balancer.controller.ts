import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { LoadBalancerService } from './load-balancer.service';
import { RegisterInstanceDto } from './dto/register-instance.dto';
import { RouteDecisionDto } from './dto/route-decision.dto';

@Controller('load-balancer')
export class LoadBalancerController {
  constructor(private readonly loadBalancerService: LoadBalancerService) {}

  @Post('instances')
  registerInstance(@Body() dto: RegisterInstanceDto) {
    return this.loadBalancerService.registerInstance(dto);
  }

  @Post('route')
  routeRequest(@Body() dto: RouteDecisionDto) {
    return this.loadBalancerService.routeRequest(dto);
  }

  @Get('health')
  getHealth() {
    return this.loadBalancerService.getHealth();
  }

  @Get('instances')
  listInstances(@Query('route') route?: string) {
    return this.loadBalancerService.listInstances(route);
  }
}
