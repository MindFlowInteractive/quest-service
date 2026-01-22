import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '../auth/public.decorator';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { LoadBalancerService } from '../load-balancer/load-balancer.service';

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private circuitBreaker: CircuitBreakerService,
        private loadBalancer: LoadBalancerService,
    ) { }

    @Get()
    @Public()
    @HealthCheck()
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }

    @Get('detailed')
    @Public()
    getDetailedHealth() {
        const circuitStates = this.circuitBreaker.getAllStates();

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            circuitBreakers: circuitStates,
            services: this.getServicesHealth(),
        };
    }

    private getServicesHealth() {
        const services = ['social', 'quest'];
        const health: Record<string, any> = {};

        for (const service of services) {
            health[service] = {
                available: this.loadBalancer.isServiceAvailable(service),
                instanceCount: this.loadBalancer.getInstanceCount(service),
                circuitState: this.circuitBreaker.getState(service),
            };
        }

        return health;
    }
}
