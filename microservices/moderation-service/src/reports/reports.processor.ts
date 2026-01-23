import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ModerationService } from '../moderation/moderation.service';
import { Report, ReportStatus } from '../entities/report.entity';

@Processor('moderation-queue')
export class ReportsProcessor extends WorkerHost {
    private readonly logger = new Logger(ReportsProcessor.name);

    constructor(
        private readonly reportsService: ReportsService,
        private readonly moderationService: ModerationService,
    ) {
        super();
    }

    async process(job: Job<{ reportId: string }>): Promise<any> {
        const { reportId } = job.data;
        this.logger.log(`Processing report ${reportId}`);

        const report = await this.reportsService.findOne(reportId);
        if (!report) {
            this.logger.error(`Report ${reportId} not found`);
            return;
        }

        // Example logic: Check if the report description itself is spam/profane
        // In a real scenario, we would fetch the reported content here.
        if (this.moderationService.containsProfanity(report.description)) {
            this.logger.warn(`Report ${reportId} description contains profanity`);
            // We might validly reject the report if the reporter is being abusive?
            // Or we just flag it.
        }

        if (this.moderationService.isSpam(report.description)) {
            this.logger.warn(`Report ${reportId} description detected as spam`);
            // different status?
        }

        // Auto-assign or move to reviewing status
        // For now, let's keep it PENDING or move to REVIEWING if we had a logic
    }
}
