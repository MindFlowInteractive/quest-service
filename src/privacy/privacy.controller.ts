import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { PrivacyService } from './privacy.service';
import { PrivacySettingsService } from './services/privacy-settings.service';
import { DataExportService } from './services/data-export.service';
import { DataDeletionService } from './services/data-deletion.service';
import { DataRetentionService } from './services/data-retention.service';
import { AuditService } from './services/audit.service';
import {
  UpdatePrivacySettingsDto,
  ConsentUpdateDto,
  DataExportRequestDto,
  DataDeletionRequestDto,
  ConfirmDeletionDto,
  CancelDeletionDto,
} from './dto';

@ApiTags('Privacy & GDPR')
@Controller('privacy')
export class PrivacyController {
  private readonly logger = new Logger(PrivacyController.name);

  constructor(
    private readonly privacyService: PrivacyService,
    private readonly settingsService: PrivacySettingsService,
    private readonly exportService: DataExportService,
    private readonly deletionService: DataDeletionService,
    private readonly retentionService: DataRetentionService,
    private readonly auditService: AuditService,
  ) {}

  // ==================== Privacy Settings ====================

  @Get('settings')
  @ApiOperation({ summary: 'Get user privacy settings' })
  @ApiResponse({ status: 200, description: 'Returns privacy settings' })
  async getSettings(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.settingsService.getSettings(userId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update privacy settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdatePrivacySettingsDto,
  ) {
    return this.settingsService.updateSettings(userId, dto);
  }

  // ==================== Consent Management ====================

  @Get('consent/history')
  @ApiOperation({ summary: 'Get consent history' })
  async getConsentHistory(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.settingsService.getConsentHistory(userId);
  }

  @Post('consent')
  @ApiOperation({ summary: 'Update specific consent' })
  async updateConsent(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ConsentUpdateDto,
  ) {
    return this.settingsService.updateConsent(userId, dto);
  }

  @Get('consent/check/:purpose')
  @ApiOperation({ summary: 'Check if user has consented to a purpose' })
  async checkConsent(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('purpose') purpose: string,
  ) {
    const hasConsent = await this.settingsService.hasConsent(userId, purpose as any);
    return { purpose, hasConsent };
  }

  // ==================== Data Export (Portability) ====================

  @Post('export')
  @ApiOperation({ summary: 'Request data export (GDPR Article 20)' })
  @ApiResponse({ status: 202, description: 'Export request accepted' })
  async requestExport(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: DataExportRequestDto,
  ) {
    return this.exportService.requestExport(userId, dto);
  }

  @Get('export/requests')
  @ApiOperation({ summary: 'Get export request history' })
  async getExportHistory(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.exportService.getExportHistory(userId);
  }

  @Get('export/:exportId/status')
  @ApiOperation({ summary: 'Check export status' })
  async getExportStatus(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('exportId') exportId: string,
  ) {
    return this.exportService.getExportStatus(exportId, userId);
  }

  @Get('export/:exportId/download')
  @ApiOperation({ summary: 'Download exported data' })
  async downloadExport(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('exportId') exportId: string,
    @Res() res: Response,
  ) {
    const { data, filename } = await this.exportService.downloadExport(exportId, userId);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  }

  // ==================== Data Deletion (Right to be Forgotten) ====================

  @Post('deletion')
  @ApiOperation({ summary: 'Request account deletion (GDPR Article 17)' })
  @ApiResponse({ status: 202, description: 'Deletion request accepted' })
  async requestDeletion(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: DataDeletionRequestDto,
  ) {
    return this.deletionService.requestDeletion(userId, dto);
  }

  @Post('deletion/confirm')
  @ApiOperation({ summary: 'Confirm deletion request' })
  async confirmDeletion(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ConfirmDeletionDto,
  ) {
    return this.deletionService.confirmDeletion(userId, dto);
  }

  @Post('deletion/cancel')
  @ApiOperation({ summary: 'Cancel pending deletion request' })
  async cancelDeletion(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CancelDeletionDto,
  ) {
    return this.deletionService.cancelDeletion(userId, dto.cancellationReason);
  }

  @Get('deletion/status')
  @ApiOperation({ summary: 'Get deletion request status' })
  async getDeletionStatus(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.deletionService.getDeletionStatus(userId);
  }

  // ==================== Data Retention ====================

  @Get('retention/policy')
  @ApiOperation({ summary: 'Get data retention policies' })
  async getRetentionPolicies() {
    return this.retentionService.getAllRetentionPolicies();
  }

  @Get('retention/summary')
  @ApiOperation({ summary: 'Get user data retention summary' })
  async getUserRetentionSummary(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.retentionService.getUserDataRetentionSummary(userId);
  }

  // ==================== Audit & Compliance ====================

  @Get('audit/logs')
  @ApiOperation({ summary: 'Get user data access audit logs' })
  async getAuditLogs(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.auditService.getUserAuditLogs(userId, { limit, offset });
  }

  @Get('audit/statistics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get data access statistics (admin)' })
  async getAccessStatistics() {
    return this.auditService.getAccessStatistics();
  }

  @Post('audit/report')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate compliance report (admin)' })
  async generateComplianceReport(
    @Body() body: { startDate: string; endDate: string },
  ) {
    return this.auditService.generateComplianceReport(
      new Date(body.startDate),
      new Date(body.endDate),
    );
  }

  // ==================== GDPR Summary ====================

  @Get('gdpr-summary')
  @ApiOperation({ summary: 'Get complete GDPR summary for user' })
  async getGdprSummary(@Param('userId', ParseUUIDPipe) userId: string) {
    const [settings, consentHistory, exportHistory, deletionStatus, auditLogs] = await Promise.all([
      this.settingsService.getSettings(userId),
      this.settingsService.getConsentHistory(userId),
      this.exportService.getExportHistory(userId),
      this.deletionService.getDeletionStatus(userId),
      this.auditService.getUserAuditLogs(userId, { limit: 10 }),
    ]);

    return {
      userId,
      privacySettings: settings,
      consentHistory,
      dataExports: exportHistory,
      deletionStatus,
      recentAccessLogs: auditLogs,
      rights: {
        access: true,
        rectification: true,
        erasure: true,
        portability: true,
        restriction: true,
        objection: true,
      },
    };
  }
}
