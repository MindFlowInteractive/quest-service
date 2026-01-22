import { Module, Global } from '@nestjs/common';
import { LoadBalancerService } from './load-balancer.service';
import { HealthCheckerService } from './health-checker.service';

@Global()
@Module({
    providers: [HealthCheckerService, LoadBalancerService],
    exports: [LoadBalancerService, HealthCheckerService],
})
export class LoadBalancerModule { }
