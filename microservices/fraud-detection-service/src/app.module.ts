import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { FraudAlert } from './entities/fraud-alert.entity';
import { BehaviorPattern } from './entities/behavior-pattern.entity';
import { Anomaly } from './entities/anomaly.entity';
import { FraudRule } from './entities/fraud-rule.entity';
import { ReviewQueue } from './entities/review-queue.entity';
import { AccountFlag } from './entities/account-flag.entity';

// Services
import { BehaviorPatternService } from './services/behavior-pattern.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { FraudRuleEngine } from './services/fraud-rule-engine.service';
import { FraudAlertService } from './services/fraud-alert.service';
import { AccountFlagService } from './services/account-flag.service';
import { FraudDetectionService } from './services/fraud-detection.service';

// Controller
import { FraudDetectionController } from './fraud-detection.controller';

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
      database: process.env.DB_NAME || 'fraud_detection_db',
      synchronize: (process.env.DB_SYNC || 'true') === 'true',
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([
      FraudAlert,
      BehaviorPattern,
      Anomaly,
      FraudRule,
      ReviewQueue,
      AccountFlag,
    ]),
  ],
  controllers: [FraudDetectionController],
  providers: [
    BehaviorPatternService,
    AnomalyDetectionService,
    FraudRuleEngine,
    FraudAlertService,
    AccountFlagService,
    FraudDetectionService,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly ruleEngine: FraudRuleEngine) {}

  /** Seed default fraud rules on startup if none exist */
  async onModuleInit() {
    await this.ruleEngine.seedDefaultRules();
  }
}
