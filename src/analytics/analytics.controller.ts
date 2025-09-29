import { Controller, Get, Query, Param, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { CreateExportJobDto } from './dto/export-job.dto';


// Assuming RolesGuard and Roles decorator exist in project
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';


@Controller('api/analytics')
@UseGuards(RolesGuard)
export class AnalyticsController {
constructor(private readonly svc: AnalyticsService) {}


@Get('players/overview')
@Roles('admin', 'analyst')
async playersOverview(@Query() q: AnalyticsFilterDto) {
return this.svc.getPlayersOverview(q);
}


@Get('puzzles/summary')
@Roles('admin', 'analyst')
async puzzlesSummary(@Query() q: AnalyticsFilterDto) {
return this.svc.getPuzzlesSummary(q);
}


@Get('events')
@Roles('admin', 'analyst')
async listEvents(@Query() q: AnalyticsFilterDto) {
return this.svc.searchEvents(q);
}


@Get('ab/:testId/results')
@Roles('admin', 'analyst')
async abResults(@Param('testId') testId: string, @Query() q: AnalyticsFilterDto) {
return this.svc.getAbTestResults(testId, q);
}


@Post('exports')
@Roles('admin', 'analyst')
@HttpCode(202)
async createExport(@Body() dto: CreateExportJobDto) {
return this.svc.createExportJob(dto);
}
}