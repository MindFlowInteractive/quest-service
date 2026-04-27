import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FraudDetectionService, FraudCheckRequest } from './services/fraud-detection.service';
import { FraudAlertService } from './services/fraud-alert.service';
import { AccountFlagService } from './services/account-flag.service';
import { FraudRuleEngine } from './services/fraud-rule-engine.service';
import { BehaviorPatternService } from './services/behavior-pattern.service';
import {
  UpdateAlertDto,
  AssignReviewDto,
  CompleteReviewDto,
  CreateRuleDto,
  SuspendAccountDto,
} from './dto/fraud.dto';
import { RecordBehaviorEventDto } from './dto/behavior.dto';
import { AlertStatus, AlertSeverity } from './entities/fraud-alert.entity';
import { ReviewStatus, ReviewPriority } from './entities/review-queue.entity';
import { FlagType } from './entities/account-flag.entity';

@ApiTags('fraud-detection')
@Controller('fraud')
export class FraudDetectionController {
  constructor(
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly fraudAlertService: FraudAlertService,
    private readonly accountFlagService: AccountFlagService,
    private readonly fraudRuleEngine: FraudRuleEngine,
    private readonly behaviorPatternService: BehaviorPatternService,
  ) {}

  // ── Fraud Check (main pipeline) ───────────────────────────────────────────

  @Post('check')
  @ApiOperation({ summary: 'Run full fraud detection pipeline for a player' })
  @ApiResponse({ status: 201, description: 'Fraud check result' })
  async runFraudCheck(@Body() req: FraudCheckRequest) {
    return this.fraudDetectionService.runFraudCheck(req);
  }

  // ── Behavioral Events ──────────────────────────────────────────────────────

  @Post('events')
  @ApiOperation({ summary: 'Record a behavioral event and trigger anomaly analysis' })
  async recordEvent(@Body() dto: RecordBehaviorEventDto) {
    await this.fraudDetectionService.recordAndAnalyze(dto);
    return { message: 'Event recorded and analyzed' };
  }

  @Get('players/:playerId/patterns')
  @ApiOperation({ summary: 'Get behavioral patterns for a player' })
  @ApiParam({ name: 'playerId' })
  @ApiQuery({ name: 'windowMinutes', required: false, type: Number })
  async getPatterns(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Query('windowMinutes') windowMinutes?: number,
  ) {
    return this.behaviorPatternService.getPlayerPatterns(playerId, windowMinutes ?? 60);
  }

  // ── Alerts ────────────────────────────────────────────────────────────────

  @Get('alerts')
  @ApiOperation({ summary: 'List fraud alerts with optional filters' })
  @ApiQuery({ name: 'playerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: AlertStatus })
  @ApiQuery({ name: 'severity', required: false, enum: AlertSeverity })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAlerts(
    @Query('playerId') playerId?: string,
    @Query('status') status?: AlertStatus,
    @Query('severity') severity?: AlertSeverity,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.fraudAlertService.getAlerts({ playerId, status, severity, page, limit });
  }

  @Get('alerts/stats')
  @ApiOperation({ summary: 'Get aggregate alert statistics' })
  async getAlertStats() {
    return this.fraudAlertService.getAlertStats();
  }

  @Patch('alerts/:id')
  @ApiOperation({ summary: 'Update fraud alert status or add review note' })
  @ApiParam({ name: 'id' })
  async updateAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlertDto,
    @Query('reviewerId') reviewerId = 'system',
  ) {
    return this.fraudAlertService.updateAlert(id, reviewerId, dto);
  }

  // ── Review Queue ──────────────────────────────────────────────────────────

  @Get('reviews')
  @ApiOperation({ summary: 'Get manual review queue' })
  @ApiQuery({ name: 'status', required: false, enum: ReviewStatus })
  @ApiQuery({ name: 'priority', required: false, enum: ReviewPriority })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getReviewQueue(
    @Query('status') status?: ReviewStatus,
    @Query('priority') priority?: ReviewPriority,
    @Query('assignedTo') assignedTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.fraudAlertService.getReviewQueue({ status, priority, assignedTo, page, limit });
  }

  @Patch('reviews/:id/assign')
  @ApiOperation({ summary: 'Assign a review item to a reviewer' })
  @ApiParam({ name: 'id' })
  async assignReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignReviewDto,
  ) {
    return this.fraudAlertService.assignReview(id, dto);
  }

  @Patch('reviews/:id/complete')
  @ApiOperation({ summary: 'Complete a review with outcome' })
  @ApiParam({ name: 'id' })
  async completeReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteReviewDto,
    @Query('reviewerId') reviewerId = 'system',
  ) {
    return this.fraudAlertService.completeReview(id, reviewerId, dto);
  }

  // ── Rules ─────────────────────────────────────────────────────────────────

  @Get('rules')
  @ApiOperation({ summary: 'Get all active fraud rules' })
  async getRules() {
    return this.fraudRuleEngine.getActiveRules();
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create a new fraud rule' })
  async createRule(@Body() dto: CreateRuleDto) {
    return this.fraudRuleEngine.createRule(dto);
  }

  @Patch('rules/:id/toggle')
  @ApiOperation({ summary: 'Enable or disable a fraud rule' })
  @ApiParam({ name: 'id' })
  async toggleRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('active') active: string,
  ) {
    return this.fraudRuleEngine.toggleRule(id, active === 'true');
  }

  // ── Account Flags & Suspension ────────────────────────────────────────────

  @Get('accounts/flagged')
  @ApiOperation({ summary: 'Get all currently flagged accounts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFlaggedAccounts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.accountFlagService.getFlaggedAccounts(page, limit);
  }

  @Get('accounts/:playerId/status')
  @ApiOperation({ summary: 'Get fraud status for a player account' })
  @ApiParam({ name: 'playerId' })
  async getAccountStatus(@Param('playerId', ParseUUIDPipe) playerId: string) {
    const [status, isSuspended] = await Promise.all([
      this.accountFlagService.getAccountStatus(playerId),
      this.accountFlagService.isAccountSuspended(playerId),
    ]);
    return { status, isSuspended };
  }

  @Post('accounts/:playerId/flag')
  @ApiOperation({ summary: 'Manually flag a player account' })
  @ApiParam({ name: 'playerId' })
  async flagAccount(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Body() body: { flagType: FlagType; reason: string; actionBy: string },
  ) {
    return this.accountFlagService.flagAccount(
      playerId,
      body.flagType,
      body.actionBy,
      body.reason,
    );
  }

  @Post('accounts/:playerId/suspend')
  @ApiOperation({ summary: 'Suspend a player account' })
  @ApiParam({ name: 'playerId' })
  async suspendAccount(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Body() dto: SuspendAccountDto,
    @Query('actionBy') actionBy = 'system',
  ) {
    return this.accountFlagService.suspendAccount(playerId, actionBy, dto);
  }

  @Patch('accounts/:playerId/unsuspend')
  @ApiOperation({ summary: 'Unsuspend a player account' })
  @ApiParam({ name: 'playerId' })
  async unsuspendAccount(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Query('actionBy') actionBy = 'system',
  ) {
    return this.accountFlagService.unsuspendAccount(playerId, actionBy);
  }

  @Patch('accounts/:playerId/lift-flag')
  @ApiOperation({ summary: 'Lift all flags on a player account' })
  @ApiParam({ name: 'playerId' })
  async liftFlag(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Body() body: { reason: string; actionBy: string },
  ) {
    return this.accountFlagService.liftFlag(playerId, body.actionBy, body.reason);
  }
}
