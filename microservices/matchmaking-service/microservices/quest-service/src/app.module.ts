import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EnergyModule } from './energy/energy.module';
import { UserEnergy } from './energy/entities/energy.entity';
import { EnergyBoost } from './energy/entities/boost.entity';
import { EnergyNotificationService } from './energy/energy-notification.service';

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
        entities: [UserEnergy, EnergyBoost],
        synchronize: true, // Set to false in production
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    EnergyModule,
  ],
  providers: [EnergyNotificationService],
})
export class AppModule {}
