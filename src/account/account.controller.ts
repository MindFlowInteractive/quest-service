import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Req,
  Res,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { DataExportService } from '../privacy/services/data-export.service';
import { DataDeletionService } from '../privacy/services/data-deletion.service';
import { AuditService } from '../privacy/services/audit.service';
import {
  DataExportRequestDto,
  DataDeletionRequestDto,
  CancelDeletionDto,
} from '../privacy/dto';
import {
  DataAccessType,
  DataAccessEntity,
  AccessReason,
} from '../privacy/entities/data-access-audit.entity';
import { User } from '../users/entities/user.entity';
import { AccountManagementService } from './account-management.service';
import {
  RequestResetDto,
  ConfirmResetDto,
  LinkAccountDto,
} from './dto/account-management.dto';

@ApiTags('Account (GDPR)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly exportService: DataExportService,
    private readonly deletionService: DataDeletionService,
    private readonly auditService: AuditService,
    private readonly managementService: AccountManagementService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // POST /account/export
  // ─────────────────────────────────────────────────────────────────────────

  @Post('export')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue a GDPR data-export job (GDPR Art. 20 — data portability)',
    description:
      'Queues an asynchronous export job. When complete the archive ' +
      '(JSON, gzipped) is stored for 24 hours and a download link is ' +
      'emailed to the account address.',
  })
  @ApiResponse({ status: 202, description: 'Export job accepted' })
  async requestExport(
    @ActiveUser() user: any,
    @Body() dto: DataExportRequestDto,
    @Req() req: Request,
  ) {
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const exportRequest = await this.exportService.requestExport(
      user.id ?? user.sub,
      dto,
      metadata,
    );

    return {
      message:
        'Export job queued. You will receive an email with the download link when it is ready.',
      exportId: exportRequest.id,
      status: exportRequest.status,
      estimatedReady: new Date(Date.now() + 5 * 60_000).toISOString(), // ~5 min
    };
  }

  @Post('export/:exportId/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Download a completed export archive' })
  @ApiResponse({ status: 200, description: 'Binary gzip archive' })
  async downloadExport(
    @ActiveUser() user: any,
    @Param('exportId') exportId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename, contentType } =
      await this.exportService.downloadExport(exportId, user.id ?? user.sub);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.byteLength);
    res.send(buffer);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE /account
  // ─────────────────────────────────────────────────────────────────────────

  @Delete()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Initiate account deletion (GDPR Art. 17 — right to erasure)',
    description:
      'Requires password confirmation. A 30-day grace period is applied ' +
      'before permanent deletion. Active sessions are revoked immediately. ' +
      'Cancel within 30 days via POST /account/restore.',
  })
  @ApiResponse({ status: 202, description: 'Deletion request accepted' })
  @ApiResponse({ status: 401, description: 'Incorrect password' })
  async deleteAccount(
    @ActiveUser() user: any,
    @Body() dto: DataDeletionRequestDto,
    @Req() req: Request,
  ) {
    const userId: string = user.id ?? user.sub;

    // Fetch the hashed password for verification
    const dbUser = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'] as any,
    });

    const request = await this.deletionService.requestDeletion(userId, dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      hashedPassword: (dbUser as any)?.password,
    });

    return {
      message:
        'Deletion request accepted. Your account will be permanently deleted after a 30-day grace period. ' +
        'You have been logged out. To cancel, use POST /account/restore within 30 days.',
      deletionId: request.id,
      scheduledFor: request.scheduledFor,
      gracePeriodDays: 30,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /account/restore
  // ─────────────────────────────────────────────────────────────────────────

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel a pending account deletion within the grace period',
  })
  @ApiResponse({
    status: 200,
    description: 'Deletion cancelled; account restored',
  })
  async restoreAccount(
    @ActiveUser() user: any,
    @Body() dto: CancelDeletionDto,
    @Req() req: Request,
  ) {
    const userId: string = user.id ?? user.sub;

    const request = await this.deletionService.restoreAccount(
      userId,
      dto.cancellationReason,
    );

    return {
      message: 'Account deletion cancelled. Your account has been restored.',
      deletionId: request.id,
      cancelledAt: request.cancelledAt,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Progression Reset  (#454)
  // ─────────────────────────────────────────────────────────────────────────

  @Post('reset')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Request a progression reset (creates backup first)',
    description:
      'Initiates a progression reset. A confirmation token is returned. ' +
      'The reset is not applied until POST /account/reset/confirm is called ' +
      'with that token (after a 5-minute safety delay).',
  })
  @ApiResponse({ status: 202, description: 'Reset request accepted' })
  async requestReset(
    @ActiveUser() user: any,
    @Body() dto: RequestResetDto,
    @Req() req: Request,
  ) {
    const reset = await this.managementService.requestReset(
      user.id ?? user.sub,
      dto,
      req.ip,
    );

    return {
      message:
        'Reset request accepted. Confirm it using the token after 5 minutes.',
      resetId: reset.id,
      confirmationToken: reset.confirmationToken,
      resetType: reset.resetType,
    };
  }

  @Post('reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a pending progression reset' })
  @ApiResponse({ status: 200, description: 'Reset applied' })
  async confirmReset(
    @ActiveUser() user: any,
    @Body() dto: ConfirmResetDto,
  ) {
    return this.managementService.confirmReset(user.id ?? user.sub, dto);
  }

  @Post('reset/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending progression reset' })
  async cancelReset(@ActiveUser() user: any) {
    return this.managementService.cancelReset(user.id ?? user.sub);
  }

  @Get('reset/backup')
  @ApiOperation({ summary: 'Retrieve the backup snapshot from the last reset' })
  async getLastBackup(@ActiveUser() user: any) {
    const backup = await this.managementService.getLastBackup(
      user.id ?? user.sub,
    );
    return { backup };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Linking  (#454)
  // ─────────────────────────────────────────────────────────────────────────

  @Post('link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Link an external provider account' })
  async linkAccount(
    @ActiveUser() user: any,
    @Body() dto: LinkAccountDto,
    @Req() req: Request,
  ) {
    return this.managementService.linkAccount(
      user.id ?? user.sub,
      dto,
      req.ip,
    );
  }

  @Delete('link/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink an external provider account' })
  async unlinkAccount(
    @ActiveUser() user: any,
    @Param('provider') provider: string,
    @Req() req: Request,
  ) {
    return this.managementService.unlinkAccount(
      user.id ?? user.sub,
      provider,
      req.ip,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Audit Trail  (#454)
  // ─────────────────────────────────────────────────────────────────────────

  @Get('audit')
  @ApiOperation({ summary: 'Get the account audit trail' })
  async getAuditTrail(
    @ActiveUser() user: any,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.managementService.getAuditTrail(user.id ?? user.sub, limit);
  }
}
