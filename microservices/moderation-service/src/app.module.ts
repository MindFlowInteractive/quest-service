import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ReportsModule } from './reports/reports.module';
import { ModerationModule } from './moderation/moderation.module';
import { ActionsModule } from './actions/actions.module';
import { AppealsModule } from './appeals/appeals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { Report } from './entities/report.entity';
import { Violation } from './entities/violation.entity';
import { Review } from './entities/review.entity';
import { Appeal } from './entities/appeal.entity';

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
                database: configService.get<string>('DB_DATABASE', 'moderation_service'),
                entities: [Report, Violation, Review, Appeal],
                synchronize: true,
            }),
            inject: [ConfigService],
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get('REDIS_HOST', 'localhost'),
                    port: configService.get('REDIS_PORT', 6379),
                },
            }),
            inject: [ConfigService],
        }),
        ReportsModule,
        ModerationModule,
        ActionsModule,
        AppealsModule,
        NotificationsModule,
    ],
})
export class AppModule { }
