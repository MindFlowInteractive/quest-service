import { Controller, Get, Query, Param, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { CreateExportJobDto } from './dto/export-job.dto';


// Assuming RolesGuard and Roles decorator exist in project
// Fixed relative paths for guards and decorators
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/constants';


@Controller('api/analytics')
@UseGuards(RolesGuard)
export class AnalyticsController {
    constructor(private readonly svc: AnalyticsService) { }


    @Get('players/overview')
    @Roles(UserRole.ADMIN, UserRole.ANALYST)
    async playersOverview(@Query() q: AnalyticsFilterDto) {
        return this.svc.getPlayersOverview(q);
    }


    @Get('puzzles/summary')
    @Roles(UserRole.ADMIN, UserRole.ANALYST)
    async puzzlesSummary(@Query() q: AnalyticsFilterDto) {
        return this.svc.getPuzzlesOverview(q);
    }


    @Get('events')
    @Roles(UserRole.ADMIN, UserRole.ANALYST)
    async listEvents(@Query() q: AnalyticsFilterDto) {
        return this.svc.getPlayerBehaviorAnalytics(q);
    }


    @Get('ab/:testId/results')
    @Roles(UserRole.ADMIN, UserRole.ANALYST)
    async abResults(@Param('testId') testId: string, @Query() q: AnalyticsFilterDto) {
        return this.svc.getAbTestResults({ ...q, testId });
    }


    @Post('exports')
    @Roles(UserRole.ADMIN, UserRole.ANALYST)
    @HttpCode(202)
    async createExport(@Body() dto: CreateExportJobDto) {
        return this.svc.exportAnalyticsData(dto.type);
    }
}