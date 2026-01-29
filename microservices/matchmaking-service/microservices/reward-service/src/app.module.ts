import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RewardModule } from './modules/reward.module';
import { AchievementModule } from './modules/achievement.module';
import { NFTModule } from './modules/nft.module';
import { WalletModule } from './modules/wallet.module';
import { TransactionMonitoringService } from './services/transaction-monitoring.service';
import { Reward } from './entities/reward.entity';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { NFT } from './entities/nft.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'reward_service',
      entities: [Reward, Achievement, UserAchievement, NFT],
      synchronize: true, // Note: Set to false in production and use migrations
      autoLoadEntities: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      },
    }),
    RewardModule,
    AchievementModule,
    NFTModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService, TransactionMonitoringService],
})
export class AppModule {}
