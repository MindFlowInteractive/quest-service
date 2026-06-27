import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { VulnerabilityReport } from './entities/report.entity';
import { Bounty } from './entities/bounty.entity';
import { Reward } from './entities/reward.entity';
import { Researcher } from './entities/researcher.entity';

// Services
import { SeverityService } from './services/severity.service';
import { ResearchersService } from './services/researchers.service';
import { BountiesService } from './services/bounties.service';
import { ReportsService } from './services/reports.service';
import { RewardsService } from './services/rewards.service';
import { LeaderboardService } from './services/leaderboard.service';

// Controllers
import { ReportsController } from './controllers/reports.controller';
import { BountiesController } from './controllers/bounties.controller';
import { ResearchersController } from './controllers/researchers.controller';
import { LeaderboardController } from './controllers/leaderboard.controller';
import { RewardsController } from './controllers/rewards.controller';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'bounty_security_db',
      // Auto-sync is dev-only. Production deployments must use real migrations.
      synchronize:
        (process.env.DB_SYNC ?? 'true') === 'true' &&
        process.env.NODE_ENV !== 'production',
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([
      VulnerabilityReport,
      Bounty,
      Reward,
      Researcher,
    ]),
  ],
  controllers: [
    ReportsController,
    BountiesController,
    ResearchersController,
    LeaderboardController,
    RewardsController,
    HealthController,
  ],
  providers: [
    SeverityService,
    ResearchersService,
    BountiesService,
    ReportsService,
    RewardsService,
    LeaderboardService,
  ],
})
export class AppModule {}
