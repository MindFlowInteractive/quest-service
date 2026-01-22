import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import CircuitBreaker = require('opossum');
import axios, { AxiosRequestConfig } from 'axios';

interface CircuitBreakerOptions {
    timeout: number;
    errorThresholdPercentage: number;
    resetTimeout: number;
    volumeThreshold: number;
}

@Injectable()
export class CircuitBreakerService implements OnModuleInit {
    private readonly logger = new Logger(CircuitBreakerService.name);
    private breakers: Map<string, CircuitBreaker> = new Map();
    private options: CircuitBreakerOptions;

    constructor(private configService: ConfigService) {
        this.options = {
            timeout: this.configService.get<number>('circuitBreaker.timeout') || 5000,
            errorThresholdPercentage:
                this.configService.get<number>(
                    'circuitBreaker.errorThresholdPercentage',
                ) || 50,
            resetTimeout:
                this.configService.get<number>('circuitBreaker.resetTimeout') || 30000,
            volumeThreshold:
                this.configService.get<number>('circuitBreaker.volumeThreshold') || 10,
        };
    }

    onModuleInit() {
        const services = this.configService.get('services');
        for (const serviceName of Object.keys(services)) {
            this.createBreaker(serviceName);
        }
    }

    private createBreaker(serviceName: string): CircuitBreaker {
        const breaker = new CircuitBreaker(
            async (config: AxiosRequestConfig) => {
                return await axios(config);
            },
            this.options,
        );

        breaker.fallback(() => ({
            status: 503,
            data: {
                error: 'Service Unavailable',
                message: `The ${serviceName} service is currently unavailable. Please try again later.`,
                service: serviceName,
            },
        }));

        breaker.on('open', () => {
            this.logger.warn(`Circuit breaker opened for service: ${serviceName}`);
        });

        breaker.on('halfOpen', () => {
            this.logger.log(`Circuit breaker half-open for service: ${serviceName}`);
        });

        breaker.on('close', () => {
            this.logger.log(`Circuit breaker closed for service: ${serviceName}`);
        });

        this.breakers.set(serviceName, breaker);
        return breaker;
    }

    async execute(
        serviceName: string,
        config: AxiosRequestConfig,
    ): Promise<any> {
        let breaker = this.breakers.get(serviceName);

        if (!breaker) {
            breaker = this.createBreaker(serviceName);
        }

        try {
            return await breaker.fire(config);
        } catch (error) {
            this.logger.error(
                `Circuit breaker error for ${serviceName}: ${error.message}`,
            );
            throw error;
        }
    }

    getState(serviceName: string): string {
        const breaker = this.breakers.get(serviceName);
        if (!breaker) {
            return 'UNKNOWN';
        }
        if (breaker.opened) {
            return 'OPEN';
        }
        if (breaker.halfOpen) {
            return 'HALF_OPEN';
        }
        if (breaker.closed) {
            return 'CLOSED';
        }
        return 'UNKNOWN';
    }

    getStats(serviceName: string): any {
        const breaker = this.breakers.get(serviceName);
        return breaker ? breaker.stats : null;
    }

    getAllStates(): Record<string, string> {
        const states: Record<string, string> = {};
        for (const [name, breaker] of this.breakers.entries()) {
            states[name] = breaker.status.name;
        }
        return states;
    }
}
