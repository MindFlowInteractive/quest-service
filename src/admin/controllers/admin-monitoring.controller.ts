import {
    Controller,
    Get,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/constants';
import { DatabaseService } from '../../config/database-service';
import { PerformanceMonitoringService } from '../../monitoring/performance.service';

@Controller('admin/monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminMonitoringController {
    private databaseService = DatabaseService.getInstance();
    private performanceService: PerformanceMonitoringService;

    constructor() {
        this.performanceService = new PerformanceMonitoringService(
            this.databaseService.getDataSource(),
        );
    }

    @Get('health')
    async checkHealth() {
        return await this.databaseService.checkHealth();
    }

    @Get('metrics')
    async getMetrics() {
        return await this.performanceService.getMetrics();
    }

    @Get('db-stats')
    async getDbStats() {
        return await this.databaseService.getConnectionStats();
    }
}
