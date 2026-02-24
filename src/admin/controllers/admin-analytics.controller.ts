import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/constants';
import { AnalyticsService } from '../../analytics/analytics.service';
import { AnalyticsFilterDto } from '../../analytics/dto/analytics-filter.dto';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('overview')
    async getOverview(@Query() filter: AnalyticsFilterDto) {
        return await this.analyticsService.getPlayersOverview(filter);
    }

    @Get('active-players')
    async getActivePlayers(@Query() filter: AnalyticsFilterDto) {
        // Reusing getPlayersOverview as it gives total distinct players in period
        return await this.analyticsService.getPlayersOverview(filter);
    }
}
