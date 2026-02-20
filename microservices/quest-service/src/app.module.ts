import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PerformanceModule } from './performance/performance.module';
import { PerformanceInterceptor } from './performance/performance.interceptor';
import { AlertingService } from './performance/alerting.service';
import { DatabaseMonitoringService } from './database/database-monitoring.service';
import { QuestModule } from './quests/quest.module';
import { Quest } from './quests/entities/quest.entity';
import { EnergyModule } from './energy/energy.module';
import { UserEnergy } from './energy/entities/energy.entity';
import { EnergyBoost } from './energy/entities/boost.entity';
import { EnergyNotificationService } from './energy/energy-notification.service';
import { StreaksModule } from './streaks/streaks.module';
import { UserStreak } from './streaks/entities/user-streak.entity';
import { UserCombo } from './streaks/entities/user-combo.entity';

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
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'quest_service'),
        entities: [UserEnergy, EnergyBoost, UserStreak, UserCombo, Quest], // Added Quest entity
        synchronize: true, // Set to false in production
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    PerformanceModule,
    QuestModule,
    EnergyModule,
    StreaksModule,
  ],
  providers: [
    EnergyNotificationService,
    DatabaseMonitoringService,
    AlertingService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
})
export class AppModule {}
