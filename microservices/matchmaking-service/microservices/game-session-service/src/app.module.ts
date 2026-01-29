import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Session } from './entities/session.entity';
import { StateSnapshot } from './entities/state.entity';
import { Replay } from './entities/replay.entity';
import { SessionService } from './services/session.service';
import { StateSnapshotService } from './services/state-snapshot.service';
import { ReplayService } from './services/replay.service';
import { RedisCacheService } from './services/redis-cache.service';
import { TimeoutHandlerService } from './services/timeout-handler.service';
import { SessionController } from './controllers/session.controller';
import { StateController } from './controllers/state.controller';
import { ReplayController } from './controllers/replay.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_NAME', 'game_session_db'),
        entities: [Session, StateSnapshot, Replay],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([Session, StateSnapshot, Replay]),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    AppController,
    SessionController,
    StateController,
    ReplayController,
  ],
  providers: [
    AppService,
    SessionService,
    StateSnapshotService,
    ReplayService,
    RedisCacheService,
    TimeoutHandlerService,
  ],
})
export class AppModule {}
