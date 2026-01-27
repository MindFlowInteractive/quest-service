import { Injectable, Inject } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import * as sharp from "sharp";
import storageConfig from "../config/storage.config";

export interface OptimizationResult {
  buffer: Buffer;
  metadata: Record<string, any>;
}

@Injectable()
export class ImageOptimizationService {
  constructor(
    @Inject(storageConfig.KEY)
    private config: ConfigType<typeof storageConfig>,
  ) {}

  async optimizeImage(buffer: Buffer): Promise<OptimizationResult> {
    const image = sharp(buffer);
    const imageMetadata = await image.metadata();

    const { maxWidth, maxHeight, quality } = this.config.optimization;

    let processedImage = image;

    // Resize if needed
    if (imageMetadata.width > maxWidth || imageMetadata.height > maxHeight) {
      processedImage = processedImage.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Optimize and convert to JPEG
    const optimized = await processedImage
      .jpeg({ quality, progressive: true })
      .toBuffer();

    return {
      buffer: optimized,
      metadata: {
        originalWidth: imageMetadata.width,
        originalHeight: imageMetadata.height,
        originalFormat: imageMetadata.format,
        optimized: true,
        optimizationQuality: quality,
      },
    };
  }

  isImage(mimeType: string): boolean {
    return mimeType.startsWith("image/");
  }
}
