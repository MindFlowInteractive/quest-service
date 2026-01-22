import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface ServiceInstance {
    url: string;
    healthy: boolean;
    lastCheck: Date;
}

@Injectable()
export class HealthCheckerService implements OnModuleInit {
    private readonly logger = new Logger(HealthCheckerService.name);
    private serviceInstances: Map<string, ServiceInstance[]> = new Map();
    private checkInterval: NodeJS.Timeout;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.initializeServices();
        this.startHealthChecks();
    }

    private initializeServices() {
        const services = this.configService.get('services');

        for (const [name, config] of Object.entries(services)) {
            const instance: ServiceInstance = {
                url: (config as any).url,
                healthy: true,
                lastCheck: new Date(),
            };
            this.serviceInstances.set(name, [instance]);
        }
    }

    private startHealthChecks() {
        const interval = this.configService.get<number>('healthCheck.interval');

        this.checkInterval = setInterval(() => {
            this.performHealthChecks();
        }, interval);

        this.performHealthChecks();
    }

    private async performHealthChecks() {
        const services = this.configService.get('services');

        for (const [name, config] of Object.entries(services)) {
            const instances = this.serviceInstances.get(name) || [];

            for (const instance of instances) {
                try {
                    const healthUrl = `${instance.url}${(config as any).healthPath}`;
                    const response = await axios.get(healthUrl, { timeout: 3000 });

                    const wasUnhealthy = !instance.healthy;
                    instance.healthy = response.status === 200;
                    instance.lastCheck = new Date();

                    if (wasUnhealthy && instance.healthy) {
                        this.logger.log(`Service ${name} is now healthy: ${instance.url}`);
                    }
                } catch (error) {
                    const wasHealthy = instance.healthy;
                    instance.healthy = false;
                    instance.lastCheck = new Date();

                    if (wasHealthy) {
                        this.logger.warn(
                            `Service ${name} is now unhealthy: ${instance.url} - ${error.message}`,
                        );
                    }
                }
            }
        }
    }

    getHealthyInstances(serviceName: string): ServiceInstance[] {
        const instances = this.serviceInstances.get(serviceName) || [];
        return instances.filter((instance) => instance.healthy);
    }

    getAllInstances(serviceName: string): ServiceInstance[] {
        return this.serviceInstances.get(serviceName) || [];
    }

    isServiceHealthy(serviceName: string): boolean {
        const healthyInstances = this.getHealthyInstances(serviceName);
        return healthyInstances.length > 0;
    }

    onModuleDestroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
}
