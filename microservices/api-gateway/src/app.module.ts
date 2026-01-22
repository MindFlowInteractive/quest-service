import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { ProxyModule } from './proxy/proxy.module';
import { AuthModule } from './auth/auth.module';
import { CircuitBreakerModule } from './circuit-breaker/circuit-breaker.module';
import { LoadBalancerModule } from './load-balancer/load-balancer.module';
import { HealthModule } from './health/health.module';
import { LoggingModule } from './logging/logging.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 100,
            },
        ]),
        LoggingModule,
        AuthModule,
        CircuitBreakerModule,
        LoadBalancerModule,
        HealthModule,
        ProxyModule,
    ],
})
export class AppModule { }
