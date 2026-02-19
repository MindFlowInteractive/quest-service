import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EnergyModule } from './energy/energy.module';
import { UserEnergy } from './energy/entities/energy.entity';
import { EnergyBoost } from './energy/entities/boost.entity';
import { EnergyNotificationService } from './energy/energy-notification.service';
import { StreaksModule } from './streaks/streaks.module';
import { UserStreak } from './streaks/entities/user-streak.entity';
import { UserCombo } from './streaks/entities/user-combo.entity';
import { RewardsModule } from './rewards/rewards.module';

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
        entities: [UserEnergy, EnergyBoost, UserStreak, UserCombo],
        synchronize: true, // Set to false in production
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    EnergyModule,
    StreaksModule,
    RewardsModule,
  ],
  providers: [EnergyNotificationService],
})
export class AppModule {}
