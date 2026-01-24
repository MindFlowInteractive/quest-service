import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Report } from '../entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Post()
    async createReport(@Body() createReportDto: CreateReportDto): Promise<Report> {
        return this.reportsService.create(createReportDto);
    }

    @Get()
    async findAll(): Promise<Report[]> {
        return this.reportsService.findAll();
    }

    @Get('stats')
    async getStats() {
        return this.reportsService.getReportStats();
    }

    @Get('pending')
    async findPending(): Promise<Report[]> {
        return this.reportsService.findPendingReports();
    }

    @Get('reviewing')
    async findReviewing(): Promise<Report[]> {
        return this.reportsService.findReviewingReports();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Report> {
        return this.reportsService.findOne(id);
    }

    @Patch(':id/assign')
    async assignToModerator(
        @Param('id') id: string,
        @Body('moderatorId') moderatorId: string,
    ): Promise<Report> {
        return this.reportsService.assignToModerator(id, moderatorId);
    }

    @Post(':id/resolve')
    async resolveReport(
        @Param('id') id: string,
        @Body() resolveDto: ResolveReportDto,
    ) {
        return this.reportsService.resolveReport(id, resolveDto);
    }
}
