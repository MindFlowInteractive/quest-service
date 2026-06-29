import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { LoadBalancerService } from '../load-balancer/load-balancer.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
    constructor(
        private readonly circuitBreaker: CircuitBreakerService,
        private readonly loadBalancer: LoadBalancerService,
        private readonly configService: ConfigService,
    ) {}

    @Get('circuit-breakers')
    @ApiOperation({ summary: 'Get all circuit breaker states' })
    @ApiResponse({ status: 200, description: 'Circuit breaker states retrieved successfully' })
    getCircuitBreakers() {
        return {
            states: this.circuitBreaker.getAllStates(),
            services: this.getAllServiceStats(),
        };
    }

    @Get('circuit-breakers/:service')
    @ApiOperation({ summary: 'Get circuit breaker stats for specific service' })
    @ApiResponse({ status: 200, description: 'Circuit breaker stats retrieved successfully' })
    getCircuitBreakerStats(@Param('service') service: string) {
        return {
            service,
            state: this.circuitBreaker.getState(service),
            stats: this.circuitBreaker.getStats(service),
        };
    }

    @Post('circuit-breakers/:service/reset')
    @ApiOperation({ summary: 'Reset circuit breaker for specific service' })
    @ApiResponse({ status: 200, description: 'Circuit breaker reset successfully' })
    resetCircuitBreaker(@Param('service') service: string) {
        // Note: This would require implementing a reset method in CircuitBreakerService
        return {
            service,
            message: 'Circuit breaker reset requested',
            state: this.circuitBreaker.getState(service),
        };
    }

    @Get('services')
    @ApiOperation({ summary: 'Get all services status' })
    @ApiResponse({ status: 200, description: 'Services status retrieved successfully' })
    getServicesStatus() {
        const services = this.configService.get('services');
        const status: Record<string, any> = {};

        for (const [serviceName, config] of Object.entries(services)) {
            status[serviceName] = {
                config: {
                    url: config.url,
                    prefix: config.prefix,
                },
                available: this.loadBalancer.isServiceAvailable(serviceName),
                instanceCount: this.loadBalancer.getInstanceCount(serviceName),
                circuitState: this.circuitBreaker.getState(serviceName),
            };
        }

        return status;
    }

    @Get('services/:service/health')
    @ApiOperation({ summary: 'Get detailed health for specific service' })
    @ApiResponse({ status: 200, description: 'Service health retrieved successfully' })
    getServiceHealth(@Param('service') service: string) {
        return {
            service,
            available: this.loadBalancer.isServiceAvailable(service),
            instanceCount: this.loadBalancer.getInstanceCount(service),
            circuitState: this.circuitBreaker.getState(service),
            circuitStats: this.circuitBreaker.getStats(service),
        };
    }

    @Get('routes')
    @ApiOperation({ summary: 'Get all routing configuration' })
    @ApiResponse({ status: 200, description: 'Routing configuration retrieved successfully' })
    getRoutes() {
        const services = this.configService.get('services');
        return Object.entries(services).map(([name, config]) => ({
            service: name,
            prefix: config.prefix,
            url: config.url,
            healthPath: config.healthPath,
        }));
    }

    @Get('config')
    @ApiOperation({ summary: 'Get gateway configuration (non-sensitive)' })
    @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
    getConfiguration() {
        return {
            rateLimit: this.configService.get('rateLimit'),
            circuitBreaker: this.configService.get('circuitBreaker'),
            cors: this.configService.get('cors'),
            services: Object.keys(this.configService.get('services')),
        };
    }

    private getAllServiceStats() {
        const services = this.configService.get('services');
        const stats: Record<string, any> = {};

        for (const serviceName of Object.keys(services)) {
            stats[serviceName] = this.circuitBreaker.getStats(serviceName);
        }

        return stats;
    }
}
