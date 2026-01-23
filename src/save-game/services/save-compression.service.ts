import { Injectable, Logger } from '@nestjs/common';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { CompressionInfo, SaveGameData } from '../interfaces/save-game.interfaces';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Buffer: NodeBuffer } = require('buffer');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

@Injectable()
export class SaveCompressionService {
  private readonly logger = new Logger(SaveCompressionService.name);

  async compress(data: SaveGameData): Promise<{
    compressedData: Buffer;
    compressionInfo: CompressionInfo;
  }> {
    const jsonString = JSON.stringify(data);
    const originalSize = NodeBuffer.byteLength(jsonString, 'utf8');

    try {
      const compressedData = await gzip(jsonString, { level: 6 });
      const compressedSize = compressedData.length;

      // Only use compression if it actually reduces size
      if (compressedSize >= originalSize) {
        this.logger.debug('Compression not beneficial, using raw data');
        return {
          compressedData: NodeBuffer.from(jsonString, 'utf8'),
          compressionInfo: {
            algorithm: 'none',
            originalSize,
            compressedSize: originalSize,
          },
        };
      }

      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
      this.logger.debug(
        `Compressed save data: ${originalSize} -> ${compressedSize} bytes (${compressionRatio}% reduction)`,
      );

      return {
        compressedData,
        compressionInfo: {
          algorithm: 'gzip',
          originalSize,
          compressedSize,
        },
      };
    } catch (error) {
      this.logger.error('Compression failed, using raw data', error);
      return {
        compressedData: NodeBuffer.from(jsonString, 'utf8'),
        compressionInfo: {
          algorithm: 'none',
          originalSize,
          compressedSize: originalSize,
        },
      };
    }
  }

  async decompress(
    compressedData: Buffer,
    compressionInfo: CompressionInfo,
  ): Promise<SaveGameData> {
    try {
      let jsonString: string;

      if (compressionInfo.algorithm === 'none') {
        jsonString = (compressedData as unknown as { toString(encoding: string): string }).toString('utf8');
      } else if (compressionInfo.algorithm === 'gzip') {
        const decompressed = await gunzip(compressedData);
        jsonString = (decompressed as unknown as { toString(encoding: string): string }).toString('utf8');
      } else {
        throw new Error(`Unsupported compression algorithm: ${compressionInfo.algorithm}`);
      }

      return JSON.parse(jsonString) as SaveGameData;
    } catch (error) {
      this.logger.error('Decompression failed', error);
      throw new Error(`Failed to decompress save data: ${error.message}`);
    }
  }

  estimateCompressedSize(data: SaveGameData): number {
    // Rough estimation: JSON typically compresses to 20-40% of original size
    const jsonSize = JSON.stringify(data).length;
    return Math.ceil(jsonSize * 0.35);
  }
}
