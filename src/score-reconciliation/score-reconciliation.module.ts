import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ScoreSubmission } from './entities/score-submission.entity';
import { ScoreRecord } from './entities/score-record.entity';
import { ScoreConflict } from './entities/score-conflict.entity';
import { ScoreReconciliationReport } from './entities/score-reconciliation-report.entity';
import { ScoreReconciliationController } from './score-reconciliation.controller';
import { ScoreReconciliationService } from './score-reconciliation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScoreSubmission,
      ScoreRecord,
      ScoreConflict,
      ScoreReconciliationReport,
    ]),
    AuthModule,
  ],
  controllers: [ScoreReconciliationController],
  providers: [ScoreReconciliationService],
  exports: [ScoreReconciliationService],
})
export class ScoreReconciliationModule {}
