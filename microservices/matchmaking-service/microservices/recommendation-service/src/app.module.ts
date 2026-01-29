import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { PreferenceModule } from './modules/preference/preference.module';
import { HistoryModule } from './modules/history/history.module';
import { BehaviorModule } from './modules/behavior/behavior.module';
import { ABTestingModule } from './modules/ab-testing/ab-testing.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const host = configService.get<string>('DATABASE_HOST');
                if (!host) {
                    return {
                        type: 'sqlite',
                        database: 'db.sqlite',
                        autoLoadEntities: true,
                        synchronize: true,
                    };
                }
                return {
                    type: 'postgres',
                    host: host,
                    port: configService.get<number>('DATABASE_PORT', 5432),
                    username: configService.get<string>('DATABASE_USER', 'postgres'),
                    password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
                    database: configService.get<string>('DATABASE_NAME', 'recommendation_db'),
                    autoLoadEntities: true,
                    synchronize: true,
                };
            },
            inject: [ConfigService],
        }),
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const redisHost = configService.get<string>('REDIS_HOST');
                if (!redisHost) {
                    return { store: 'memory' };
                }
                return {
                    store: await redisStore({
                        socket: {
                            host: redisHost,
                            port: configService.get<number>('REDIS_PORT', 6379),
                        },
                    }),
                };
            },
            inject: [ConfigService],
        }),
        RecommendationModule,
        PreferenceModule,
        HistoryModule,
        BehaviorModule,
        ABTestingModule,
    ],
})
export class AppModule { }
