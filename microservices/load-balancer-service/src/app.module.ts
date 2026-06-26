import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { LoadBalancerModule } from './load-balancer/load-balancer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ ttl: 30, max: 500 }),
    LoadBalancerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
