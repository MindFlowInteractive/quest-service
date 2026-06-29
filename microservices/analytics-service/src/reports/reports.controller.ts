import { Controller, Get, Post, Body } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getReports() {
    return await this.reportsService.getAllReports();
  }

  @Post('generate')
  async generateReport(@Body() reportConfig: any) {
    return await this.reportsService.generateReport(reportConfig);
  }

  @Get('dashboard')
  async getDashboardData() {
    return await this.reportsService.getDashboardData();
  }
}
