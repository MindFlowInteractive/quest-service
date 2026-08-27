import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheWarmingModule } from './cache-warming/cache-warming.module';
import { CacheJob } from './cache-warming/entities/cache-job.entity';
import { Metric } from './cache-warming/entities/metric.entity';
import { PreloadData } from './cache-warming/entities/preload-data.entity';
import { DeadLetterEvent } from './events/dead-letter-event.entity';
import { Event } from './events/event.entity';
import { EventsModule } from './events/events.module';
import { JobsModule } from './jobs/jobs.module';
import { Job } from './jobs/job.entity';
import { CdnModule } from './cdn/cdn.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_NAME', 'cache_warming_db'),
        entities: [CacheJob, PreloadData, Metric, Event, DeadLetterEvent, Job],
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    CacheWarmingModule,
    EventsModule,
    JobsModule,
    CdnModule,
    AdminModule,
  ],
})
export class AppModule {}
