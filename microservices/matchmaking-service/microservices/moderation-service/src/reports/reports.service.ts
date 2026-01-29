import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Report, ReportStatus } from '../entities/report.entity';
import { Review, ReviewDecision } from '../entities/review.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);

    constructor(
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>,
        @InjectRepository(Review)
        private reviewsRepository: Repository<Review>,
        @InjectQueue('moderation-queue') private moderationQueue: Queue,
    ) { }

    async create(createReportDto: CreateReportDto): Promise<Report> {
        const report = this.reportsRepository.create(createReportDto);
        const savedReport = await this.reportsRepository.save(report);

        // Add to moderation queue for automated processing
        await this.moderationQueue.add('check-report', {
            reportId: savedReport.id,
        });

        this.logger.log(`Report ${savedReport.id} created and queued`);
        return savedReport;
    }

    async findAll(): Promise<Report[]> {
        return this.reportsRepository.find({ order: { createdAt: 'DESC' } });
    }

    async findOne(id: string): Promise<Report> {
        const report = await this.reportsRepository.findOne({ where: { id } });
        if (!report) {
            throw new NotFoundException(`Report ${id} not found`);
        }
        return report;
    }

    // ===== Manual Review Workflow =====

    async findPendingReports(): Promise<Report[]> {
        return this.reportsRepository.find({
            where: { status: ReportStatus.PENDING },
            order: { createdAt: 'ASC' }, // Oldest first
        });
    }

    async findReviewingReports(): Promise<Report[]> {
        return this.reportsRepository.find({
            where: { status: ReportStatus.REVIEWING },
            order: { createdAt: 'ASC' },
        });
    }

    async assignToModerator(reportId: string, moderatorId: string): Promise<Report> {
        const report = await this.findOne(reportId);

        if (report.status !== ReportStatus.PENDING) {
            throw new BadRequestException(`Report ${reportId} is not in PENDING status`);
        }

        report.status = ReportStatus.REVIEWING;
        // In a real app, you might store moderatorId on the report
        this.logger.log(`Report ${reportId} assigned to moderator ${moderatorId}`);
        return this.reportsRepository.save(report);
    }

    async resolveReport(reportId: string, resolveDto: ResolveReportDto): Promise<{ report: Report; review: Review }> {
        const report = await this.findOne(reportId);

        if (report.status === ReportStatus.RESOLVED || report.status === ReportStatus.DISMISSED) {
            throw new BadRequestException(`Report ${reportId} is already resolved`);
        }

        // Create review record
        const review = this.reviewsRepository.create({
            reportId: report.id,
            moderatorId: resolveDto.moderatorId,
            decision: resolveDto.decision,
            comments: resolveDto.comments,
        });
        const savedReview = await this.reviewsRepository.save(review);

        // Update report status based on decision
        report.status = resolveDto.decision === ReviewDecision.APPROVED
            ? ReportStatus.RESOLVED
            : ReportStatus.DISMISSED;
        const savedReport = await this.reportsRepository.save(report);

        this.logger.log(`Report ${reportId} resolved by ${resolveDto.moderatorId} with decision ${resolveDto.decision}`);

        return { report: savedReport, review: savedReview };
    }

    async getReportStats(): Promise<{
        pending: number;
        reviewing: number;
        resolved: number;
        dismissed: number;
        total: number;
    }> {
        const [pending, reviewing, resolved, dismissed, total] = await Promise.all([
            this.reportsRepository.count({ where: { status: ReportStatus.PENDING } }),
            this.reportsRepository.count({ where: { status: ReportStatus.REVIEWING } }),
            this.reportsRepository.count({ where: { status: ReportStatus.RESOLVED } }),
            this.reportsRepository.count({ where: { status: ReportStatus.DISMISSED } }),
            this.reportsRepository.count(),
        ]);

        return { pending, reviewing, resolved, dismissed, total };
    }
}
