import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './report.entity';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly metricsService: MetricsService,
  ) {}

  async getAllReports() {
    return await this.reportRepository.find({ order: { generatedAt: 'DESC' } });
  }

  async generateReport(config: any) {
    const metrics = await this.metricsService.getMetrics();
    
    // Simple report generation logic
    const reportData = metrics.filter(m => !config.metricNames || config.metricNames.includes(m.name));

    const report = this.reportRepository.create({
      title: config.title || 'General Analytics Report',
      type: config.type || 'on-demand',
      data: reportData,
    });

    return await this.reportRepository.save(report);
  }

  async getDashboardData() {
    const metrics = await this.metricsService.getMetrics();
    return {
      summary: metrics,
      lastUpdated: new Date(),
    };
  }
}
