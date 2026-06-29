import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportStatsDto } from './dto/report-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/constants';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a new report' })
  @ApiResponse({ status: 201, description: 'Report successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - duplicate report or invalid data' })
  async createReport(@Request() req, @Body() createReportDto: CreateReportDto) {
    const report = await this.reportsService.createReport(req.user.id, createReportDto);
    return {
      message: 'Report submitted successfully',
      report,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get paginated moderator queue sorted by priority' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const pageNum = page ? parseInt(page.toString()) : 1;
    const limitNum = limit ? parseInt(limit.toString()) : 20;
    
    const { reports, total } = await this.reportsService.getReports(pageNum, limitNum);
    
    return {
      reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update report status and resolution' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReport(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
    @Request() req
  ) {
    const report = await this.reportsService.updateReport(id, updateReportDto, req.user.id);
    return {
      message: 'Report updated successfully',
      report,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(): Promise<ReportStatsDto> {
    return this.reportsService.getReportStats();
  }
}
