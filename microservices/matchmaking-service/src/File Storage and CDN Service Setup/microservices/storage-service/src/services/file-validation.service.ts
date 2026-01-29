import { Injectable, BadRequestException, Inject } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import storageConfig from "../config/storage.config";

@Injectable()
export class FileValidationService {
  constructor(
    @Inject(storageConfig.KEY)
    private config: ConfigType<typeof storageConfig>,
  ) {}

  validateFile(file: Express.Multer.File, category: string): void {
    this.validateFileSize(file);
    this.validateMimeType(file, category);
  }

  private validateFileSize(file: Express.Multer.File): void {
    const maxSize = this.config.upload.maxFileSize;

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
      );
    }
  }

  private validateMimeType(file: Express.Multer.File, category: string): void {
    const allowedTypes =
      this.config.upload.allowedMimeTypes[category] ||
      this.config.upload.allowedMimeTypes.other;

    if (!allowedTypes.includes("*") && !allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type for category ${category}. Allowed: ${allowedTypes.join(", ")}`,
      );
    }
  }
}
