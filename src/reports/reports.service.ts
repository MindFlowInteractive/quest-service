import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { ContentReport, ReportTargetType, ReportStatus, ReportPriority } from './entities/content-report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportStatsDto } from './dto/report-stats.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ContentReport)
    private readonly reportsRepository: Repository<ContentReport>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createReport(reporterId: string, createReportDto: CreateReportDto): Promise<ContentReport> {
    const { targetType, targetId, reason } = createReportDto;

    // Check for duplicate report from same user on same target
    const existingReport = await this.reportsRepository.findOne({
      where: {
        reporterId,
        targetType,
        targetId,
        status: ReportStatus.OPEN,
      },
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this content');
    }

    // Check for existing reports on same target to determine priority
    const existingReportsCount = await this.reportsRepository.count({
      where: {
        targetType,
        targetId,
        status: ReportStatus.OPEN,
      },
    });

    let priority = ReportPriority.LOW;
    if (existingReportsCount >= 3) {
      priority = ReportPriority.HIGH;
    } else if (existingReportsCount >= 1) {
      priority = ReportPriority.MEDIUM;
    }

    // Check for auto-escalation (5+ reports in 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReportsCount = await this.reportsRepository.count({
      where: {
        targetType,
        targetId,
        createdAt: MoreThan(twentyFourHoursAgo),
      },
    });

    if (recentReportsCount >= 5) {
      priority = ReportPriority.CRITICAL;
      // Escalate all existing reports
      await this.reportsRepository.update(
        {
          targetType,
          targetId,
          status: ReportStatus.OPEN,
        },
        { priority: ReportPriority.CRITICAL }
      );
    }

    const report = this.reportsRepository.create({
      reporterId,
      targetType,
      targetId,
      reason,
      priority,
    });

    const savedReport = await this.reportsRepository.save(report);

    // Emit event for auto-escalation check
    this.eventEmitter.emit('report.created', {
      report: savedReport,
      recentReportsCount,
    });

    return savedReport;
  }

  async getReports(page: number = 1, limit: number = 20): Promise<{ reports: ContentReport[], total: number }> {
    const skip = (page - 1) * limit;

    const [reports, total] = await this.reportsRepository.findAndCount({
      relations: ['reporter'],
      order: {
        priority: 'DESC',
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });

    return { reports, total };
  }

  async updateReport(id: string, updateReportDto: UpdateReportDto, moderatorId: string): Promise<ContentReport> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: ['reporter'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const { status, resolution } = updateReportDto;

    // Update report
    await this.reportsRepository.update(id, {
      status,
      resolution,
      resolvedAt: status === ReportStatus.RESOLVED ? new Date() : null,
      resolvedBy: status === ReportStatus.RESOLVED ? moderatorId : null,
    });

    // Refresh to get updated data
    const updatedReport = await this.reportsRepository.findOne({
      where: { id },
      relations: ['reporter'],
    });

    // Emit event for notification
    if (status === ReportStatus.RESOLVED) {
      this.eventEmitter.emit('report.resolved', {
        report: updatedReport,
        resolution,
      });
    }

    return updatedReport;
  }

  async getReportStats(): Promise<ReportStatsDto> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Open reports count
    const openCount = await this.reportsRepository.count({
      where: { status: ReportStatus.OPEN },
    });

    // Total reports
    const totalReports = await this.reportsRepository.count();

    // Reports resolved today
    const resolvedToday = await this.reportsRepository.count({
      where: {
        status: ReportStatus.RESOLVED,
        resolvedAt: MoreThan(startOfDay),
      },
    });

    // Escalated reports (critical priority)
    const escalatedReports = await this.reportsRepository.count({
      where: { priority: ReportPriority.CRITICAL, status: ReportStatus.OPEN },
    });

    // Reports by type
    const reportsByTypeRaw = await this.reportsRepository
      .createQueryBuilder('report')
      .select('report.targetType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('report.targetType')
      .getRawMany();

    const reportsByType = reportsByTypeRaw.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {});

    // Average resolution time
    const avgResolutionTimeResult = await this.reportsRepository
      .createQueryBuilder('report')
      .select('AVG(EXTRACT(EPOCH FROM (report.resolvedAt - report.createdAt)))', 'avgTime')
      .where('report.status = :status', { status: ReportStatus.RESOLVED })
      .andWhere('report.resolvedAt IS NOT NULL')
      .andWhere('report.createdAt > :date', { date: twentyFourHoursAgo })
      .getRawOne();

    const averageResolutionTime = avgResolutionTimeResult.avgTime 
      ? parseFloat(avgResolutionTimeResult.avgTime) 
      : 0;

    return {
      openCount,
      averageResolutionTime,
      reportsByType,
      totalReports,
      resolvedToday,
      escalatedReports,
    };
  }

  async checkAutoEscalation(reportId: string): Promise<void> {
    const report = await this.reportsRepository.findOne({ where: { id: reportId } });
    if (!report) return;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReportsCount = await this.reportsRepository.count({
      where: {
        targetType: report.targetType,
        targetId: report.targetId,
        createdAt: MoreThan(twentyFourHoursAgo),
      },
    });

    if (recentReportsCount >= 5) {
      await this.reportsRepository.update(
        {
          targetType: report.targetType,
          targetId: report.targetId,
          status: ReportStatus.OPEN,
        },
        { priority: ReportPriority.CRITICAL }
      );

      this.eventEmitter.emit('report.escalated', {
        targetType: report.targetType,
        targetId: report.targetId,
        reportCount: recentReportsCount,
      });
    }
  }
}
