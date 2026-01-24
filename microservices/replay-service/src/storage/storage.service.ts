import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface StorageConfig {
  type: 'local' | 's3' | 'azure';
  path?: string; // For local storage
  bucket?: string; // For S3
  region?: string; // For S3
}

@Injectable()
export class StorageService {
  private storageType: 'local' | 's3' | 'azure';
  private basePath: string;

  constructor(private readonly configService: ConfigService) {
    this.storageType = this.configService.get<string>('STORAGE_TYPE', 'local') as any;
    this.basePath = this.configService.get<string>('STORAGE_PATH', './storage/replays');
  }

  /**
   * Store a replay file
   */
  async storeReplay(
    replayId: string,
    data: Buffer,
    metadata?: Record<string, any>,
  ): Promise<{ url: string; key: string; size: number }> {
    if (this.storageType === 'local') {
      return this.storeLocal(replayId, data, metadata);
    } else if (this.storageType === 's3') {
      return this.storeS3(replayId, data, metadata);
    } else if (this.storageType === 'azure') {
      return this.storeAzure(replayId, data, metadata);
    }

    throw new BadRequestException(`Unsupported storage type: ${this.storageType}`);
  }

  /**
   * Retrieve a replay file
   */
  async retrieveReplay(key: string): Promise<Buffer> {
    if (this.storageType === 'local') {
      return this.retrieveLocal(key);
    } else if (this.storageType === 's3') {
      return this.retrieveS3(key);
    } else if (this.storageType === 'azure') {
      return this.retrieveAzure(key);
    }

    throw new BadRequestException(`Unsupported storage type: ${this.storageType}`);
  }

  /**
   * Delete a stored replay
   */
  async deleteReplay(key: string): Promise<void> {
    if (this.storageType === 'local') {
      await this.deleteLocal(key);
    } else if (this.storageType === 's3') {
      await this.deleteS3(key);
    } else if (this.storageType === 'azure') {
      await this.deleteAzure(key);
    }
  }

  // ==================== Local Storage ====================

  private async storeLocal(
    replayId: string,
    data: Buffer,
    metadata?: Record<string, any>,
  ): Promise<{ url: string; key: string; size: number }> {
    // Ensure directory exists
    await fs.mkdir(this.basePath, { recursive: true });

    const fileName = `${replayId}-${Date.now()}.replay`;
    const filePath = path.join(this.basePath, fileName);

    await fs.writeFile(filePath, data);

    return {
      key: fileName,
      url: `/storage/replays/${fileName}`,
      size: data.length,
    };
  }

  private async retrieveLocal(key: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, key);

    // Security check: ensure path stays within basePath
    const resolvedPath = path.resolve(filePath);
    const resolvedBasePath = path.resolve(this.basePath);

    if (!resolvedPath.startsWith(resolvedBasePath)) {
      throw new BadRequestException('Invalid storage key');
    }

    try {
      return await fs.readFile(filePath);
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve replay: ${error.message}`);
    }
  }

  private async deleteLocal(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);

    // Security check
    const resolvedPath = path.resolve(filePath);
    const resolvedBasePath = path.resolve(this.basePath);

    if (!resolvedPath.startsWith(resolvedBasePath)) {
      throw new BadRequestException('Invalid storage key');
    }

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new BadRequestException(`Failed to delete replay: ${error.message}`);
      }
    }
  }

  // ==================== S3 Storage (Placeholder) ====================

  private async storeS3(
    replayId: string,
    data: Buffer,
    metadata?: Record<string, any>,
  ): Promise<{ url: string; key: string; size: number }> {
    // TODO: Implement S3 storage using AWS SDK
    // This requires configuration with @aws-sdk/client-s3
    throw new BadRequestException('S3 storage not yet implemented');
  }

  private async retrieveS3(key: string): Promise<Buffer> {
    // TODO: Implement S3 retrieval
    throw new BadRequestException('S3 storage not yet implemented');
  }

  private async deleteS3(key: string): Promise<void> {
    // TODO: Implement S3 deletion
  }

  // ==================== Azure Storage (Placeholder) ====================

  private async storeAzure(
    replayId: string,
    data: Buffer,
    metadata?: Record<string, any>,
  ): Promise<{ url: string; key: string; size: number }> {
    // TODO: Implement Azure Blob Storage using @azure/storage-blob
    throw new BadRequestException('Azure storage not yet implemented');
  }

  private async retrieveAzure(key: string): Promise<Buffer> {
    // TODO: Implement Azure retrieval
    throw new BadRequestException('Azure storage not yet implemented');
  }

  private async deleteAzure(key: string): Promise<void> {
    // TODO: Implement Azure deletion
  }
}
