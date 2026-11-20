import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/constants';
import { ScoreReconciliationService } from './score-reconciliation.service';
import { ReconciliationTrigger } from './entities/score-reconciliation-report.entity';
import {
  ListConflictsQueryDto,
  ListReportsQueryDto,
  ResolveConflictDto,
  RunReconciliationDto,
} from './dto/score-reconciliation.dto';

/** Admin-only endpoints for the score reconciliation job. */
@Controller('score-reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ScoreReconciliationController {
  constructor(private readonly reconciliation: ScoreReconciliationService) {}

  /** POST /score-reconciliation/run — run the job now and return its report. */
  @Post('run')
  run(@Body() dto: RunReconciliationDto) {
    return this.reconciliation.run(ReconciliationTrigger.MANUAL, {
      lookbackHours: dto?.lookbackHours,
    });
  }

  /** GET /score-reconciliation/reports — most recent reports first. */
  @Get('reports')
  listReports(@Query() query: ListReportsQueryDto) {
    return this.reconciliation.listReports(query.limit);
  }

  /** GET /score-reconciliation/reports/:reportId */
  @Get('reports/:reportId')
  getReport(@Param('reportId', ParseUUIDPipe) reportId: string) {
    return this.reconciliation.getReport(reportId);
  }

  /** GET /score-reconciliation/conflicts?status=open */
  @Get('conflicts')
  listConflicts(@Query() query: ListConflictsQueryDto) {
    return this.reconciliation.listConflicts(query.status, query.limit);
  }

  /** PATCH /score-reconciliation/conflicts/:conflictId/resolve */
  @Patch('conflicts/:conflictId/resolve')
  resolveConflict(
    @Param('conflictId', ParseUUIDPipe) conflictId: string,
    @Body() dto: ResolveConflictDto,
  ) {
    return this.reconciliation.resolveConflict(conflictId, dto.resolution);
  }
}
