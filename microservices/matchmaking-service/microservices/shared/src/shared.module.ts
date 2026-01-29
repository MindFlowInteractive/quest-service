import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQService } from './brokers/rabbitmq.service';
import { RedisService as RedisBrokerService } from './brokers/redis.service';
import { EventBusService, EventPublisherService } from './event-bus/event-bus.service';
import { RedisServiceDiscovery, ServiceRegistry } from './discovery/service-discovery.service';
import { GrpcClientService } from './grpc/grpc-client.service';

@Module({
  imports: [ConfigModule],
  providers: [
    RabbitMQService,
    RedisBrokerService,
    EventBusService,
    EventPublisherService,
    RedisServiceDiscovery,
    ServiceRegistry,
    GrpcClientService,
  ],
  exports: [
    RabbitMQService,
    RedisBrokerService,
    EventBusService,
    EventPublisherService,
    RedisServiceDiscovery,
    ServiceRegistry,
    GrpcClientService,
  ],
})
export class SharedModule {}
