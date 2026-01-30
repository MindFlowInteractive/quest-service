import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ContentFile, FileType } from '../entities/content-file.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface UploadResult {
  id: string;
  storageKey: string;
  cdnUrl: string;
  thumbnailUrl?: string;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: Date;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ContentFile)
    private readonly contentFileRepository: Repository<ContentFile>,
  ) {
    const baseURL = this.configService.get<string>('STORAGE_SERVICE_URL', 'http://storage-service:3008');

    this.httpClient = axios.create({
      baseURL,
      timeout: 30000,
    });
  }

  async uploadFile(
    contentId: string,
    file: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<ContentFile> {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([new Uint8Array(file)]), originalName);
      formData.append('contentId', contentId);

      const response = await this.httpClient.post<UploadResult>('/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadResult = response.data;

      const fileType = this.determineFileType(mimeType);

      const contentFile = this.contentFileRepository.create({
        contentId,
        originalName,
        storageKey: uploadResult.storageKey,
        mimeType,
        size: file.length,
        fileType,
        cdnUrl: uploadResult.cdnUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        isProcessed: false,
      });

      const savedFile = await this.contentFileRepository.save(contentFile);
      this.logger.log(`File uploaded: ${savedFile.id} for content ${contentId}`);

      return savedFile;
    } catch (error) {
      this.logger.error(`Failed to upload file for content ${contentId}:`, error);
      throw new HttpException(
        'Failed to upload file to storage service',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getSignedUrl(fileId: string): Promise<SignedUrlResult> {
    try {
      const file = await this.contentFileRepository.findOne({ where: { id: fileId } });

      if (!file) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      const response = await this.httpClient.get<SignedUrlResult>(
        `/storage/files/${file.storageKey}/signed-url`,
      );

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`Failed to get signed URL for file ${fileId}:`, error);
      throw new HttpException(
        'Failed to get signed URL from storage service',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const file = await this.contentFileRepository.findOne({ where: { id: fileId } });

      if (!file) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      await this.httpClient.delete(`/storage/files/${file.storageKey}`);

      await this.contentFileRepository.remove(file);
      this.logger.log(`File deleted: ${fileId}`);
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`Failed to delete file ${fileId}:`, error);
      throw new HttpException(
        'Failed to delete file from storage service',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getFilesByContentId(contentId: string): Promise<ContentFile[]> {
    return this.contentFileRepository.find({ where: { contentId } });
  }

  async markFileAsProcessed(fileId: string, metadata?: Record<string, any>): Promise<ContentFile> {
    const file = await this.contentFileRepository.findOne({ where: { id: fileId } });

    if (!file) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    file.isProcessed = true;
    if (metadata) {
      file.metadata = { ...file.metadata, ...metadata };
    }

    return this.contentFileRepository.save(file);
  }

  async markFileAsFailed(fileId: string, error: string): Promise<ContentFile> {
    const file = await this.contentFileRepository.findOne({ where: { id: fileId } });

    if (!file) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    file.isProcessed = false;
    file.processingError = error;

    return this.contentFileRepository.save(file);
  }

  private determineFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.startsWith('audio/')) return FileType.AUDIO;
    return FileType.DOCUMENT;
  }
}
