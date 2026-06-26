import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { SegmentationModule } from './segmentation/segmentation.module';

import { Segment } from './segmentation/entities/segment.entity';
import { Rule } from './segmentation/entities/rule.entity';
import { Membership } from './segmentation/entities/membership.entity';
import { SegmentEvent } from './segmentation/entities/segment-event.entity';
import {
  AbAssignment,
  AbExperiment,
} from './segmentation/entities/ab-experiment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_NAME', 'segmentation_db'),
        entities: [
          Segment,
          Rule,
          Membership,
          SegmentEvent,
          AbExperiment,
          AbAssignment,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    SegmentationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
