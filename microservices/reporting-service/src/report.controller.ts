import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { Report, ReportFormat } from './report.entity';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  create(@Body() body: Partial<Report>): Promise<Report> {
    return this.reportService.create(body);
  }

  @Get()
  findAll(): Promise<Report[]> {
    return this.reportService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Report | null> {
    return this.reportService.findOne(id);
  }

  @Get(':id/export')
  export(
    @Param('id') id: string,
    @Query('format') format: ReportFormat = ReportFormat.JSON,
  ) {
    return this.reportService.export(id, format);
  }
}