import { Module } from '@nestjs/common';
import { LoadBalancerService } from './load-balancer.service';
import { LoadBalancerController } from './load-balancer.controller';

@Module({
  providers: [LoadBalancerService],
  controllers: [LoadBalancerController],
})
export class LoadBalancerModule {}
