import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigType } from "@nestjs/config";
import * as crypto from "crypto";
import { File, Upload, Metadata } from "../entities";
import { UploadFileDto } from "../dto";
import { S3Service } from "./s3.service";
import { ImageOptimizationService } from "./image-optimization.service";
import { FileValidationService } from "./file-validation.service";
import storageConfig from "../config/storage.config";

@Injectable()
export class StorageService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
    @InjectRepository(Metadata)
    private readonly metadataRepository: Repository<Metadata>,
    private readonly s3Service: S3Service,
    private readonly imageOptimizationService: ImageOptimizationService,
    private readonly fileValidationService: FileValidationService,
    @Inject(storageConfig.KEY)
    private config: ConfigType<typeof storageConfig>,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: UploadFileDto,
  ): Promise<File> {
    // Validate file
    this.fileValidationService.validateFile(file, uploadDto.category);

    // Create upload record
    const upload = this.uploadRepository.create({
      userId: uploadDto.userId,
      status: "pending",
    });
    await this.uploadRepository.save(upload);

    try {
      upload.status = "processing";
      await this.uploadRepository.save(upload);

      // Generate unique filename
      const fileName = this.generateFileName(file.originalname);
      const path = `${uploadDto.category}/${uploadDto.userId}/${fileName}`;

      // Process and optimize image if applicable
      let buffer = file.buffer;
      let metadata: Record<string, any> = uploadDto.metadata || {};

      if (this.imageOptimizationService.isImage(file.mimetype)) {
        const optimized =
          await this.imageOptimizationService.optimizeImage(buffer);
        buffer = optimized.buffer;
        metadata = { ...metadata, ...optimized.metadata };
      }

      // Upload to S3
      await this.s3Service.uploadFile(path, buffer, file.mimetype, {
        originalName: file.originalname,
        userId: uploadDto.userId,
        category: uploadDto.category,
      });

      // Create file record
      const fileRecord = this.fileRepository.create({
        originalName: file.originalname,
        fileName,
        mimeType: file.mimetype,
        size: buffer.length,
        path,
        bucket: this.s3Service.getBucket(),
        category: uploadDto.category,
        userId: uploadDto.userId,
        isPublic: uploadDto.isPublic || false,
        metadata,
        cdnUrl: this.generateCdnUrl(path),
      });

      await this.fileRepository.save(fileRecord);

      // Update upload record
      upload.fileId = fileRecord.id;
      upload.status = "completed";
      await this.uploadRepository.save(upload);

      // Save metadata
      if (uploadDto.metadata) {
        await this.saveMetadata(fileRecord.id, uploadDto.metadata);
      }

      return fileRecord;
    } catch (error) {
      upload.status = "failed";
      upload.errorMessage = error.message;
      await this.uploadRepository.save(upload);
      throw error;
    }
  }

  async getFile(fileId: string, userId: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    // Check access control
    if (!file.isPublic && file.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return file;
  }

  async getSignedUrl(
    fileId: string,
    userId: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const file = await this.getFile(fileId, userId);
    return this.s3Service.getSignedUrl(file.path, expiresIn);
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.getFile(fileId, userId);

    if (file.userId !== userId) {
      throw new ForbiddenException("Cannot delete file");
    }

    // Soft delete
    file.deletedAt = new Date();
    await this.fileRepository.save(file);

    // Schedule cleanup
    const cleanupDelay = this.config.cleanup.delayMs;
    setTimeout(() => this.cleanupFile(fileId), cleanupDelay);
  }

  async createNewVersion(
    fileId: string,
    newFile: Express.Multer.File,
    userId: string,
  ): Promise<File> {
    const originalFile = await this.getFile(fileId, userId);

    if (originalFile.userId !== userId) {
      throw new ForbiddenException("Cannot version file");
    }

    const newVersion = await this.uploadFile(newFile, {
      category: originalFile.category as any,
      userId,
      isPublic: originalFile.isPublic,
      metadata: originalFile.metadata,
    });

    newVersion.version = originalFile.version + 1;
    newVersion.previousVersionId = originalFile.id;
    await this.fileRepository.save(newVersion);

    return newVersion;
  }

  async listFiles(
    userId: string,
    category?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ files: File[]; total: number }> {
    const query = this.fileRepository
      .createQueryBuilder("file")
      .where("file.userId = :userId", { userId })
      .andWhere("file.deletedAt IS NULL");

    if (category) {
      query.andWhere("file.category = :category", { category });
    }

    const [files, total] = await query
      .orderBy("file.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { files, total };
  }

  private async cleanupFile(fileId: string): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
    });

    if (!file || !file.deletedAt) {
      return;
    }

    // Delete from S3
    await this.s3Service.deleteFile(file.path);

    // Delete from database
    await this.fileRepository.delete(fileId);
    await this.metadataRepository.delete({ fileId });
  }

  private async saveMetadata(
    fileId: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    const records = Object.entries(metadata).map(([key, value]) =>
      this.metadataRepository.create({
        fileId,
        key,
        value: JSON.stringify(value),
      }),
    );

    await this.metadataRepository.save(records);
  }

  private generateFileName(originalName: string): string {
    const ext = originalName.split(".").pop();
    const hash = crypto.randomBytes(16).toString("hex");
    return `${Date.now()}-${hash}.${ext}`;
  }

  private generateCdnUrl(path: string): string {
    const cdnBaseUrl = this.config.cdn.baseUrl;

    if (cdnBaseUrl) {
      return `${cdnBaseUrl}/${path}`;
    }

    return `https://${this.s3Service.getBucket()}.s3.amazonaws.com/${path}`;
  }
}
