import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  EnvironmentVariables,
  validateEnvironment,
} from './config/env.validation';
import appConfig from './config/app.config';
import { createLoggerConfig } from './config/logger.config';
import { UsersModule } from './users/users.module';
import { PuzzlesModule } from './puzzles/puzzles.module';
// import { AchievementsModule } from './achievements/achievements.module';
import { HealthModule } from './health/health.module';
// import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { HintsModule } from './hints/hints.module';

import { DifficultyScalingModule } from './difficulty-scaling/difficulty-scaling.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Logging
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService<EnvironmentVariables>) =>
        createLoggerConfig(configService),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('app.throttle.ttl') || 60000,
          limit: configService.get('app.throttle.limit') || 100,
        },
      ],
      inject: [ConfigService],
    }),

    // Feature modules
    UsersModule,
    PuzzlesModule,
    // AchievementsModule,
    HealthModule,
    // LeaderboardModule,
    HintsModule,
  DifficultyScalingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
