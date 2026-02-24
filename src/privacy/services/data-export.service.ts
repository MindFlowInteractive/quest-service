import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  DataExportRequest,
  ExportStatus,
  ExportFormat,
} from '../entities/data-export-request.entity';
import { DataAccessAudit, DataAccessType, DataAccessEntity, AccessReason } from '../entities/data-access-audit.entity';
import { DataExportRequestDto } from '../dto/data-export-request.dto';
import { UserDataExport } from '../interfaces';

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);
  private readonly exportExpirationHours: number;

  constructor(
    @InjectRepository(DataExportRequest)
    private exportRequestRepository: Repository<DataExportRequest>,
    @InjectRepository(DataAccessAudit)
    private auditRepository: Repository<DataAccessAudit>,
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
  ) {
    this.exportExpirationHours = this.configService.get<number>('DATA_EXPORT_EXPIRATION_HOURS', 72);
  }

  /**
   * Request data export
   */
  async requestExport(
    userId: string,
    dto: DataExportRequestDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<DataExportRequest> {
    // Check for existing pending exports
    const existingExport = await this.exportRequestRepository.findOne({
      where: { userId, status: ExportStatus.PENDING },
    });

    if (existingExport) {
      throw new Error('You already have a pending export request. Please wait for it to complete.');
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

    // Log the access
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

    // Process export asynchronously
    this.processExport(saved.id, userId);

    return saved;
  }

  /**
   * Process data export
   */
  private async processExport(exportId: string, userId: string): Promise<void> {
    try {
      await this.exportRequestRepository.update(exportId, {
        status: ExportStatus.PROCESSING,
        processedAt: new Date(),
      });

      // Gather user data from all relevant entities
      const userData = await this.gatherUserData(userId);

      // Generate file based on format
      const { fileUrl, fileSize } = await this.generateExportFile(exportId, userData);

      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.exportExpirationHours);

      await this.exportRequestRepository.update(exportId, {
        status: ExportStatus.COMPLETED,
        fileUrl,
        fileSize,
        expiresAt,
      });

      this.eventEmitter.emit('privacy.data_export_completed', {
        userId,
        exportId,
        timestamp: new Date(),
      });

      this.logger.log(`Data export ${exportId} completed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error processing export ${exportId}:`, error);
      
      await this.exportRequestRepository.update(exportId, {
        status: ExportStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Gather all user data
   */
  private async gatherUserData(userId: string): Promise<UserDataExport> {
    // This would integrate with your existing services
    // For now, returning a structured template
    const exportData: UserDataExport = {
      userId,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      personalInfo: {
        email: '', // Would be fetched from user service
        username: '',
        createdAt: new Date().toISOString(),
      },
      gameData: {
        sessions: [],
        achievements: [],
        progress: [],
        statistics: {},
      },
      transactions: [],
      socialData: {
        friends: [],
        messages: [],
        activities: [],
      },
      privacySettings: {},
      consentHistory: [],
    };

    // TODO: Integrate with actual services to fetch:
    // - User profile data
    // - Game sessions and progress
    // - Achievements
    // - Blockchain transactions
    // - Social connections
    // - Privacy settings and consent history

    return exportData;
  }

  /**
   * Generate export file
   */
  private async generateExportFile(
    exportId: string,
    data: UserDataExport,
  ): Promise<{ fileUrl: string; fileSize: number }> {
    // In production, this would:
    // 1. Write to a secure storage (S3, etc.)
    // 2. Encrypt the file
    // 3. Generate a signed URL
    
    const fileName = `export-${exportId}.json`;
    const fileContent = JSON.stringify(data, null, 2);
    const fileSize = Buffer.byteLength(fileContent, 'utf8');

    // Placeholder - in production, upload to secure storage
    const fileUrl = `/api/privacy/exports/${exportId}/download`;

    return { fileUrl, fileSize };
  }

  /**
   * Get export status
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
   * Get user's export history
   */
  async getExportHistory(userId: string): Promise<DataExportRequest[]> {
    return this.exportRequestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Download export file
   */
  async downloadExport(exportId: string, userId: string): Promise<{
    data: UserDataExport;
    filename: string;
  }> {
    const exportRequest = await this.getExportStatus(exportId, userId);

    if (exportRequest.status !== ExportStatus.COMPLETED) {
      throw new Error('Export is not ready for download');
    }

    if (exportRequest.expiresAt && new Date() > exportRequest.expiresAt) {
      await this.exportRequestRepository.update(exportId, { status: ExportStatus.EXPIRED });
      throw new Error('Export has expired. Please request a new export.');
    }

    // Update download count
    await this.exportRequestRepository.update(exportId, {
      downloadCount: exportRequest.downloadCount + 1,
      downloadedAt: new Date(),
    });

    // In production, fetch from secure storage
    const data = await this.gatherUserData(userId);
    const filename = `quest-service-data-export-${exportId}.json`;

    return { data, filename };
  }

  /**
   * Clean up expired exports
   */
  async cleanupExpiredExports(): Promise<number> {
    const expired = await this.exportRequestRepository.find({
      where: {
        status: ExportStatus.COMPLETED,
        expiresAt: LessThan(new Date()),
      },
    });

    for (const exportRequest of expired) {
      await this.exportRequestRepository.update(exportRequest.id, {
        status: ExportStatus.EXPIRED,
        fileUrl: null,
      });
      
      // In production, also delete from storage
    }

    return expired.length;
  }

  /**
   * Log data access
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

// Helper for LessThan
import { LessThan } from 'typeorm';
