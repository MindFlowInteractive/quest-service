import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import * as zlib from 'zlib';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import {
  DataExportRequest,
  ExportStatus,
  ExportFormat,
} from '../entities/data-export-request.entity';
import {
  DataAccessAudit,
  DataAccessType,
  DataAccessEntity,
  AccessReason,
} from '../entities/data-access-audit.entity';
import { DataExportRequestDto } from '../dto/data-export-request.dto';
import { UserDataExport } from '../interfaces';

const gzip = promisify(zlib.gzip);

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);
  /** Hours before download link expires (default 24) */
  private readonly exportExpirationHours: number;
  /** Local temp directory for stored exports */
  private readonly exportStorageDir: string;

  constructor(
    @InjectRepository(DataExportRequest)
    private exportRequestRepository: Repository<DataExportRequest>,
    @InjectRepository(DataAccessAudit)
    private auditRepository: Repository<DataAccessAudit>,
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
  ) {
    this.exportExpirationHours = this.configService.get<number>(
      'DATA_EXPORT_EXPIRATION_HOURS',
      24,
    );
    this.exportStorageDir = this.configService.get<string>(
      'EXPORT_STORAGE_DIR',
      path.join(process.cwd(), 'tmp', 'exports'),
    );
    // Ensure storage directory exists
    fs.mkdirSync(this.exportStorageDir, { recursive: true });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Queue an async data-export job.
   * Returns immediately with a PENDING request; processing happens in background.
   */
  async requestExport(
    userId: string,
    dto: DataExportRequestDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<DataExportRequest> {
    // Prevent duplicate pending exports
    const existing = await this.exportRequestRepository.findOne({
      where: { userId, status: ExportStatus.PENDING },
    });
    if (existing) {
      throw new BadRequestException(
        'You already have a pending export request. Please wait for it to complete.',
      );
    }

    const exportRequest = this.exportRequestRepository.create({
      userId,
      format: dto.format || ExportFormat.JSON,
      scope: dto.scope,
      customEntities: dto.customEntities,
      ipAddress: metadata?.ipAddress,
      status: ExportStatus.PENDING,
    });

    const saved = await this.exportRequestRepository.save(exportRequest);

    // Audit log
    await this.logDataAccess({
      userId,
      accessedBy: userId,
      accessType: DataAccessType.EXPORT,
      entityType: DataAccessEntity.USER,
      accessReason: AccessReason.DATA_EXPORT,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      accessDetails: { scope: dto.scope, format: dto.format },
    });

    // Fire-and-forget async processing
    setImmediate(() => this.processExport(saved.id, userId));

    this.logger.log(`Export job queued: ${saved.id} for user ${userId}`);
    return saved;
  }

  /**
   * Get the status of a specific export request.
   */
  async getExportStatus(exportId: string, userId: string): Promise<DataExportRequest> {
    const exportRequest = await this.exportRequestRepository.findOne({
      where: { id: exportId, userId },
    });
    if (!exportRequest) {
      throw new NotFoundException('Export request not found');
    }
    return exportRequest;
  }

  /**
   * Get export history for a user.
   */
  async getExportHistory(userId: string): Promise<DataExportRequest[]> {
    return this.exportRequestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Stream the zipped JSON archive to the caller.
   */
  async downloadExport(
    exportId: string,
    userId: string,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const exportRequest = await this.getExportStatus(exportId, userId);

    if (exportRequest.status !== ExportStatus.COMPLETED) {
      throw new BadRequestException('Export is not ready for download yet.');
    }

    if (exportRequest.expiresAt && new Date() > exportRequest.expiresAt) {
      await this.exportRequestRepository.update(exportId, {
        status: ExportStatus.EXPIRED,
      });
      throw new BadRequestException(
        'Export link has expired. Please request a new export.',
      );
    }

    // Read stored zip file
    const filePath = this.buildFilePath(exportId);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Export file not found. Please request a new export.');
    }

    const buffer = fs.readFileSync(filePath);

    // Increment download counter
    await this.exportRequestRepository.update(exportId, {
      downloadCount: exportRequest.downloadCount + 1,
      downloadedAt: new Date(),
    });

    return {
      buffer,
      filename: `gdpr-export-${exportId}.json.gz`,
      contentType: 'application/gzip',
    };
  }

  /**
   * Cron-safe cleanup: mark expired COMPLETED exports and remove their files.
   */
  async cleanupExpiredExports(): Promise<number> {
    const expired = await this.exportRequestRepository.find({
      where: {
        status: ExportStatus.COMPLETED,
        expiresAt: LessThan(new Date()),
      },
    });

    for (const exportRequest of expired) {
      // Delete physical file
      const filePath = this.buildFilePath(exportRequest.id);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await this.exportRequestRepository.update(exportRequest.id, {
        status: ExportStatus.EXPIRED,
        fileUrl: null,
      });
    }

    this.logger.log(`Cleaned up ${expired.length} expired exports`);
    return expired.length;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal helpers – data gathering & file generation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Async processing loop.
   */
  private async processExport(exportId: string, userId: string): Promise<void> {
    try {
      await this.exportRequestRepository.update(exportId, {
        status: ExportStatus.PROCESSING,
        processedAt: new Date(),
      });

      const userData = await this.gatherUserData(userId);
      const { filePath, fileSize } = await this.generateZippedExport(exportId, userData);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.exportExpirationHours);

      const fileUrl = `/account/export/${exportId}/download`;

      await this.exportRequestRepository.update(exportId, {
        status: ExportStatus.COMPLETED,
        fileUrl,
        fileSize,
        expiresAt,
      });

      this.eventEmitter.emit('privacy.data_export_completed', {
        userId,
        exportId,
        downloadUrl: fileUrl,
        expiresAt,
        timestamp: new Date(),
      });

      this.logger.log(`Export ${exportId} completed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Export processing failed for ${exportId}:`, error);
      await this.exportRequestRepository.update(exportId, {
        status: ExportStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Gather all user data from every relevant table.
   * Each data source is fetched via event so that domain modules stay decoupled.
   */
  async gatherUserData(userId: string): Promise<UserDataExport> {
    // Emit collection events; listeners respond with data
    const results: Record<string, any> = {};

    const collectPromises = [
      'privacy.gather.profile',
      'privacy.gather.achievements',
      'privacy.gather.sessions',
      'privacy.gather.puzzleCompletions',
      'privacy.gather.skillRatings',
      'privacy.gather.wallet',
      'privacy.gather.friends',
      'privacy.gather.notifications',
      'privacy.gather.privacySettings',
      'privacy.gather.consentHistory',
    ].map(async (event) => {
      try {
        const key = event.split('.').pop()!;
        const data = await this.eventEmitter.emitAsync(event, { userId });
        results[key] = data?.[0] ?? null;
      } catch {
        // Non-fatal: missing module data leaves section empty
      }
    });

    await Promise.allSettled(collectPromises);

    const profile = results['profile'] ?? {};
    const achievements = results['achievements'] ?? [];
    const sessions = results['sessions'] ?? [];
    const puzzleCompletions = results['puzzleCompletions'] ?? [];
    const skillRatings = results['skillRatings'] ?? [];
    const wallet = results['wallet'] ?? { addresses: [], balanceHistory: [] };
    const friends = results['friends'] ?? { friends: [], friendRequests: [] };
    const notifications = results['notifications'] ?? { preferences: {}, history: [] };
    const privacySettings = results['privacySettings'] ?? {};
    const consentHistory = results['consentHistory'] ?? [];

    return {
      userId,
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      exportFormat: 'JSON/GZIP',
      personalInfo: {
        email: profile.email ?? '',
        username: profile.username ?? '',
        firstName: profile.firstName,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth,
        country: profile.country,
        avatar: profile.avatar,
        createdAt: profile.createdAt ?? new Date().toISOString(),
        lastLoginAt: profile.lastLoginAt,
        isVerified: profile.isVerified,
      },
      profile: {
        bio: profile.profile?.bio,
        website: profile.profile?.website,
        socialLinks: profile.profile?.socialLinks,
        level: profile.level,
        experience: profile.experience,
        totalScore: profile.totalScore,
        preferences: profile.preferences,
      },
      gameData: {
        sessions,
        achievements,
        progress: [],
        statistics: profile.statistics ?? {},
        puzzleCompletions,
        skillRatings,
      },
      wallet: {
        addresses: wallet.addresses ?? [],
        balanceHistory: wallet.balanceHistory ?? [],
      },
      notifications: {
        preferences: notifications.preferences ?? {},
        history: notifications.history ?? [],
      },
      socialData: {
        friends: friends.friends ?? [],
        friendRequests: friends.friendRequests ?? [],
        activities: friends.activities ?? [],
      },
      privacySettings,
      consentHistory,
      transactions: wallet.transactions ?? [],
    };
  }

  /**
   * Serialise data as JSON, gzip it, persist to local storage.
   */
  private async generateZippedExport(
    exportId: string,
    data: UserDataExport,
  ): Promise<{ filePath: string; fileSize: number }> {
    const json = JSON.stringify(data, null, 2);
    const compressed = await gzip(Buffer.from(json, 'utf8'));
    const filePath = this.buildFilePath(exportId);

    fs.writeFileSync(filePath, compressed);

    return { filePath, fileSize: compressed.byteLength };
  }

  private buildFilePath(exportId: string): string {
    return path.join(this.exportStorageDir, `export-${exportId}.json.gz`);
  }

  /**
   * Internal audit helper.
   */
  private async logDataAccess(data: {
    userId: string;
    accessedBy: string;
    accessType: DataAccessType;
    entityType: DataAccessEntity;
    accessReason: AccessReason;
    ipAddress?: string;
    userAgent?: string;
    accessDetails?: any;
  }): Promise<void> {
    const audit = this.auditRepository.create(data);
    await this.auditRepository.save(audit);
  }
}
