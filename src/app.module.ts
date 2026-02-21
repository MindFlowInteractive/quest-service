import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnvironment } from './config/env.validation';
import appConfig from './config/app.config';
import { createLoggerConfig } from './config/logger.config';
import { UsersModule } from './users/users.module';
import { PlayerProfileModule } from './player-profile/player-profile.module';
import { PuzzlesModule } from './puzzles/puzzles.module';
import { HealthModule } from './health/health.module';
import { HintsModule } from './hints/hints.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WalletModule } from './wallet/wallet.module';
import { DifficultyScalingModule } from './difficulty-scaling/difficulty-scaling.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { TutorialModule } from './tutorial/tutorial.module';
import { ReferralsModule } from './referrals/referrals.module';
import { SaveGameModule } from './save-game/save-game.module';
import { PlayerModule } from './player/player.module';
import { ProfileModule } from './profile/profile.module';
import { ProgressModule } from './progress/progress.module';
import { SorobanModule } from './soroban/soroban.module';
import { NFTModule } from './nft/nft.module';
import { RewardsModule } from './rewards/rewards.module';
import { PuzzleModule } from './puzzle/puzzle.module';
import { EventModule } from './event/event.module';
import { SeasonalEventsModule } from './seasonal-events/seasonal-events.module';
import { MultiplayerModule } from './multiplayer/multiplayer.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { AntiCheatModule } from './anti-cheat/anti-cheat.module';
import { QuestsModule } from './quests/quests.module';
import { BlockchainTransactionModule } from './blockchain-transaction/blockchain-transaction.module';
import { PrivacyModule } from './privacy/privacy.module';
import { DailyChallengesModule } from './daily-challenges/daily-challenges.module';

@Module({
  imports: [
    // Configuration — must be first
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'quest_db'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),

    // Message broker
    RabbitMQModule,

    // Logging
    WinstonModule.forRootAsync({
      useFactory: (configService: any) => createLoggerConfig(configService),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: (configService: any) => [
        {
          ttl: configService.get('app.throttle.ttl') || 60000,
          limit: configService.get('app.throttle.limit') || 100,
        },
      ],
      inject: [ConfigService],
    }),

    // Feature modules
    UsersModule,
    PlayerProfileModule,
    PuzzlesModule,
    NotificationsModule,
    WalletModule,
    HealthModule,
    HintsModule,
    DifficultyScalingModule,
    TournamentsModule,
    TutorialModule,
    ReferralsModule,
    SaveGameModule,
    PlayerModule,
    ProfileModule,
    ProgressModule,
    SorobanModule,
    NFTModule,
    RewardsModule,
    PuzzleModule,
    EventModule,
    SeasonalEventsModule,
    MultiplayerModule,
    RecommendationsModule,
    AntiCheatModule,
    QuestsModule,
    BlockchainTransactionModule,
    PrivacyModule,
    DailyChallengesModule,
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
