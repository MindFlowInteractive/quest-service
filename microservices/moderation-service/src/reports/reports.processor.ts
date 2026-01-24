import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModerationService } from '../moderation/moderation.service';
import { Report, ReportStatus } from '../entities/report.entity';
import { Violation, ViolationSeverity, ActionTaken } from '../entities/violation.entity';

@Processor('moderation-queue')
export class ReportsProcessor extends WorkerHost {
    private readonly logger = new Logger(ReportsProcessor.name);

    constructor(
        private readonly moderationService: ModerationService,
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>,
        @InjectRepository(Violation)
        private violationsRepository: Repository<Violation>,
    ) {
        super();
    }

    async process(job: Job<{ reportId: string }>): Promise<any> {
        const { reportId } = job.data;
        this.logger.log(`Processing report ${reportId}`);

        const report = await this.reportsRepository.findOne({ where: { id: reportId } });
        if (!report) {
            this.logger.error(`Report ${reportId} not found`);
            return { success: false, reason: 'Report not found' };
        }

        // Analyze the report description for violations
        const analysis = this.moderationService.analyzeContent(report.description || '');

        this.logger.log(
            `Report ${reportId} analysis: profanity=${analysis.hasProfanity}, spam=${analysis.isSpam}, severity=${analysis.severity}`,
        );

        // If the reporter is being abusive (profanity in report), flag for review
        if (analysis.hasProfanity) {
            this.logger.warn(`Report ${reportId} contains profanity - flagging for manual review`);
            report.status = ReportStatus.REVIEWING;
            await this.reportsRepository.save(report);

            return {
                success: true,
                action: 'FLAGGED_FOR_REVIEW',
                reason: 'Report description contains inappropriate content',
                analysis,
            };
        }

        // If detected as spam, dismiss the report automatically
        if (analysis.isSpam) {
            this.logger.warn(`Report ${reportId} detected as spam - auto-dismissing`);
            report.status = ReportStatus.DISMISSED;
            await this.reportsRepository.save(report);

            return {
                success: true,
                action: 'AUTO_DISMISSED',
                reason: 'Report detected as spam',
                analysis,
            };
        }

        // For high-severity content, create a violation record and escalate
        if (analysis.severity === 'HIGH') {
            this.logger.warn(`Report ${reportId} has high severity - creating violation record`);

            const violation = this.violationsRepository.create({
                userId: report.reportedEntityId, // The reported user
                type: 'AUTO_DETECTED',
                severity: ViolationSeverity.HIGH,
                description: `Auto-detected violation from report ${reportId}: ${analysis.reasons.join(', ')}`,
                actionTaken: ActionTaken.NONE, // Will be handled by manual review
            });
            await this.violationsRepository.save(violation);

            report.status = ReportStatus.REVIEWING;
            await this.reportsRepository.save(report);

            return {
                success: true,
                action: 'ESCALATED',
                reason: 'High severity violation detected',
                violationId: violation.id,
                analysis,
            };
        }

        // Valid report - keep as pending for manual review
        this.logger.log(`Report ${reportId} passed automated checks - queued for manual review`);

        return {
            success: true,
            action: 'QUEUED_FOR_REVIEW',
            reason: 'Passed automated checks',
            analysis,
        };
    }
}
