import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module';
import { LoadBalancerModule } from '../load-balancer/load-balancer.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, CircuitBreakerModule, LoadBalancerModule],
  controllers: [AdminController],
})
export class AdminModule {}
