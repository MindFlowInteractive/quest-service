import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { Content } from './entities/content.entity.js';
import { Submission } from './entities/submission.entity.js';
import { ModerationAction } from './entities/moderation-action.entity.js';
import { ModerationQueue } from './entities/moderation-queue.entity.js';
import { FeaturedContent } from './entities/featured-content.entity.js';
import { ContentFile } from './entities/content-file.entity.js';

import { ContentModule } from './content/content.module.js';
import { SubmissionModule } from './submission/submission.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { FeaturedModule } from './featured/featured.module.js';
import { StorageModule } from './storage/storage.module.js';
import { EventsModule } from './events/events.module.js';
import { HealthController } from './health/health.controller.js';

import databaseConfig from './config/database.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres123'),
        database: configService.get<string>('DB_DATABASE', 'content_service'),
        entities: [
          Content,
          Submission,
          ModerationAction,
          ModerationQueue,
          FeaturedContent,
          ContentFile,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([Content]),

    ScheduleModule.forRoot(),

    ContentModule,
    SubmissionModule,
    ModerationModule,
    FeaturedModule,
    StorageModule,
    EventsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
