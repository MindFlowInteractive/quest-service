import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/constants';
import { PuzzleModerationService } from '../../puzzles/services/puzzle-moderation.service';
import { PuzzleSubmissionStatus } from '../../puzzles/entities/user-puzzle-submission.entity';
import { ModerationDecisionDto } from '../../puzzles/dto/user-puzzle-submission.dto';
import { AdminAuditLogService } from '../services/admin-audit-log.service';
import { ActiveUser } from '../../auth/decorators/active-user.decorator';

@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminModerationController {
    constructor(
        private readonly moderationService: PuzzleModerationService,
        private readonly auditLogService: AdminAuditLogService,
    ) { }

    @Get('queue')
    async getQueue(
        @Query('status') status?: PuzzleSubmissionStatus,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return await this.moderationService.getModerationQueue(status, page, limit);
    }

    @Post(':id/moderate')
    async moderate(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() decision: ModerationDecisionDto,
        @ActiveUser() admin: any,
    ) {
        const result = await this.moderationService.moderatePuzzle(id, admin.id, decision);
        await this.auditLogService.log({
            adminId: admin.id,
            action: 'MODERATE_PUZZLE',
            targetType: 'PUZZLE_SUBMISSION',
            targetId: id,
            details: decision,
        });
        return result;
    }

    @Get('stats')
    async getStats(@Query('timeframe') timeframe?: 'day' | 'week' | 'month') {
        return await this.moderationService.getModerationStats(timeframe);
    }
}
