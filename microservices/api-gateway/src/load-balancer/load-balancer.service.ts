import { Injectable, Logger } from '@nestjs/common';
import { HealthCheckerService } from './health-checker.service';

@Injectable()
export class LoadBalancerService {
    private readonly logger = new Logger(LoadBalancerService.name);
    private roundRobinCounters: Map<string, number> = new Map();

    constructor(private healthChecker: HealthCheckerService) { }

    getNextInstance(serviceName: string): string | null {
        const healthyInstances =
            this.healthChecker.getHealthyInstances(serviceName);

        if (healthyInstances.length === 0) {
            this.logger.warn(`No healthy instances available for ${serviceName}`);
            return null;
        }

        const counter = this.roundRobinCounters.get(serviceName) || 0;
        const index = counter % healthyInstances.length;
        const instance = healthyInstances[index];

        this.roundRobinCounters.set(serviceName, counter + 1);

        return instance.url;
    }

    getInstanceCount(serviceName: string): number {
        return this.healthChecker.getHealthyInstances(serviceName).length;
    }

    isServiceAvailable(serviceName: string): boolean {
        return this.healthChecker.isServiceHealthy(serviceName);
    }
}
