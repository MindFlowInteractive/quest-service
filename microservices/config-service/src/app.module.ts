import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigurationModule } from './modules/configuration/configuration.module';
import { EnvironmentModule } from './modules/environment/environment.module';
import { SecretModule } from './modules/secret/secret.module';
import { AuditModule } from './modules/audit/audit.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { Config, Environment, Secret, AuditLog, WebhookSubscription } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: parseInt(process.env.CACHE_TTL || '3600', 10) * 1000,
      max: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'config_db',
      entities: [Config, Environment, Secret, AuditLog, WebhookSubscription],
      synchronize: process.env.NODE_ENV !== 'production',
      autoLoadEntities: true,
      logging: process.env.NODE_ENV === 'development',
    }),
    ConfigurationModule,
    EnvironmentModule,
    SecretModule,
    AuditModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
