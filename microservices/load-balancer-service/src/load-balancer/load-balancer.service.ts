import { Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectCacheManager } from '@nestjs/cache-manager';
import { v4 as uuidv4 } from 'uuid';
import { RegisterInstanceDto } from './dto/register-instance.dto';
import { RouteDecisionDto, RoutingStrategy } from './dto/route-decision.dto';
import { LoadBalancerEntity } from './entities/load-balancer.entity';
import { RouteEntity } from './entities/route.entity';
import { RuleEntity } from './entities/rule.entity';

interface InstanceMetadata {
  targetUrl: string;
  route: string;
  weight: number;
  active: boolean;
  failedChecks: number;
  connectionCount: number;
  requestRate: number;
  lastRequestAt: number;
  region?: string;
}

@Injectable()
export class LoadBalancerService {
  private readonly logger = new Logger(LoadBalancerService.name);
  private readonly balancers: Map<string, LoadBalancerEntity> = new Map();
  private readonly instances: Map<string, InstanceMetadata> = new Map();
  private readonly routes: Map<string, RouteEntity> = new Map();
  private readonly rules: Map<string, RuleEntity> = new Map();
  private readonly routeCounters: Map<string, number> = new Map();
  private readonly circuitOpenUntil: Map<string, number> = new Map();

  constructor(@InjectCacheManager() private readonly cacheManager: Cache) {
    this.createDefaultLoadBalancer();
  }

  registerInstance(dto: RegisterInstanceDto) {
    const instanceId = uuidv4();
    const routeKey = dto.route.toLowerCase();
    const weight = dto.weight ?? 1;
    const instance: InstanceMetadata = {
      targetUrl: dto.targetUrl,
      route: routeKey,
      region: dto.region,
      weight,
      active: true,
      failedChecks: 0,
      connectionCount: 0,
      requestRate: 0,
      lastRequestAt: Date.now(),
    };

    this.instances.set(instanceId, instance);
    this.ensureRoute(routeKey);
    const route = this.routes.get(routeKey)!;
    route.targetInstances.push(instanceId);

    this.logger.log(`Registered instance ${instanceId} for route ${routeKey}`);
    return { instanceId, routeKey, weight, targetUrl: dto.targetUrl };
  }

  listInstances(route?: string) {
    const instances = Array.from(this.instances.entries()).map(([id, metadata]) => ({ id, ...metadata }));
    return route ? instances.filter((instance) => instance.route === route.toLowerCase()) : instances;
  }

  getHealth() {
    return {
      totalRoutes: this.routes.size,
      totalInstances: this.instances.size,
      activeInstances: Array.from(this.instances.values()).filter((instance) => instance.active).length,
      rules: Array.from(this.rules.values()),
    };
  }

  async routeRequest(dto: RouteDecisionDto) {
    const routeKey = dto.route.toLowerCase();
    const route = this.routes.get(routeKey);
    if (!route) {
      throw new Error(`Route ${routeKey} not found`);
    }

    const cachedTarget = await this.cacheManager.get<string>(`route-cache:${routeKey}`);
    if (cachedTarget) {
      this.logger.log(`Cache hit for route ${routeKey}: ${cachedTarget}`);
      this.incrementConnection(cachedTarget);
      return { targetUrl: cachedTarget, source: 'cache' };
    }

    const candidateInstances = this.filterHealthyInstances(route.targetInstances);
    if (!candidateInstances.length) {
      throw new Error(`No healthy instances available for route ${routeKey}`);
    }

    const targetInstanceId = this.selectInstance(routeKey, dto, candidateInstances, route.strategy);
    const targetInstance = this.instances.get(targetInstanceId)!;
    if (!targetInstance.active) {
      throw new Error(`Selected instance ${targetInstanceId} is unhealthy`);
    }

    this.incrementConnection(targetInstanceId);
    this.updateRequestRate(targetInstanceId);
    await this.cacheManager.set(`route-cache:${routeKey}`, targetInstance.targetUrl, { ttl: route.cacheTtlSeconds });

    return { targetUrl: targetInstance.targetUrl, strategy: route.strategy, source: 'computed' };
  }

  private createDefaultLoadBalancer() {
    const id = uuidv4();
    const loadBalancer: LoadBalancerEntity = {
      id,
      name: 'default-load-balancer',
      routes: [],
      defaultStrategy: RoutingStrategy.ROUND_ROBIN,
      createdAt: new Date(),
    };
    this.balancers.set(id, loadBalancer);
  }

  private ensureRoute(route: string) {
    if (!this.routes.has(route)) {
      const routeEntity: RouteEntity = {
        route,
        strategy: RoutingStrategy.ROUND_ROBIN,
        targetInstances: [],
        cachedTarget: undefined,
        cacheTtlSeconds: 30,
      };
      this.routes.set(route, routeEntity);
      this.routeCounters.set(route, 0);
      const balancer = Array.from(this.balancers.values())[0];
      balancer.routes.push(route);
    }
  }

  private filterHealthyInstances(targetIds: string[]) {
    return targetIds.filter((instanceId) => {
      const instance = this.instances.get(instanceId);
      return instance?.active && !this.isCircuitOpen(instanceId);
    });
  }

  private isCircuitOpen(instanceId: string) {
    const openUntil = this.circuitOpenUntil.get(instanceId);
    return openUntil ? openUntil > Date.now() : false;
  }

  private selectInstance(
    routeKey: string,
    dto: RouteDecisionDto,
    candidates: string[],
    strategy: string,
  ) {
    switch (strategy) {
      case RoutingStrategy.WEIGHTED:
        return this.selectWeighted(candidates);
      case RoutingStrategy.LEAST_CONNECTIONS:
        return this.selectLeastConnections(candidates);
      case RoutingStrategy.RATE_BASED:
        return this.selectRateBased(candidates);
      default:
        return this.selectRoundRobin(routeKey, candidates);
    }
  }

  private selectRoundRobin(routeKey: string, candidates: string[]) {
    const counter = this.routeCounters.get(routeKey) ?? 0;
    const index = counter % candidates.length;
    this.routeCounters.set(routeKey, counter + 1);
    return candidates[index];
  }

  private selectWeighted(candidates: string[]) {
    const weightedPool = candidates.flatMap((id) => {
      const instance = this.instances.get(id)!;
      return Array(instance.weight).fill(id);
    });
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    return weightedPool[randomIndex];
  }

  private selectLeastConnections(candidates: string[]) {
    return candidates.reduce((winner, current) => {
      const currentMeta = this.instances.get(current)!;
      const winnerMeta = this.instances.get(winner)!;
      return currentMeta.connectionCount < winnerMeta.connectionCount ? current : winner;
    }, candidates[0]);
  }

  private selectRateBased(candidates: string[]) {
    return candidates.reduce((winner, current) => {
      const currentMeta = this.instances.get(current)!;
      const winnerMeta = this.instances.get(winner)!;
      return currentMeta.requestRate < winnerMeta.requestRate ? current : winner;
    }, candidates[0]);
  }

  private incrementConnection(instanceId: string) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    instance.connectionCount += 1;
    this.instances.set(instanceId, instance);
  }

  private updateRequestRate(instanceId: string) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    const now = Date.now();
    const elapsedSeconds = Math.max((now - instance.lastRequestAt) / 1000, 1);
    instance.requestRate = instance.requestRate + 1 / elapsedSeconds;
    instance.lastRequestAt = now;
    this.instances.set(instanceId, instance);
  }

  private recordFailure(instanceId: string) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    instance.failedChecks += 1;
    if (instance.failedChecks >= 3) {
      instance.active = false;
      this.circuitOpenUntil.set(instanceId, Date.now() + 10000);
      this.logger.warn(`Circuit opened for ${instanceId}`);
    }
    this.instances.set(instanceId, instance);
  }

  private recordSuccess(instanceId: string) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    instance.failedChecks = 0;
    instance.active = true;
    this.instances.set(instanceId, instance);
    this.circuitOpenUntil.delete(instanceId);
  }
}
