import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from '../entities/report.entity';
import { Review } from '../entities/review.entity';
import { Violation } from '../entities/violation.entity';
import { ModerationModule } from '../moderation/moderation.module';
import { ReportsProcessor } from './reports.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([Report, Review, Violation]),
        BullModule.registerQueue({
            name: 'moderation-queue',
        }),
        ModerationModule,
    ],
    controllers: [ReportsController],
    providers: [ReportsService, ReportsProcessor],
    exports: [ReportsService],
})
export class ReportsModule { }
