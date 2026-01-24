import { Injectable } from '@nestjs/common';
import { createGzip, createBrotliCompress, gunzip, createBrotliDecompress } from 'zlib';
import { promisify } from 'util';
import { CompressionType } from '../entities/recording.entity';

const gunzipAsync = promisify(gunzip);

@Injectable()
export class CompressionService {
  /**
   * Compress data using the specified compression type
   */
  async compress(
    data: Buffer | string,
    type: CompressionType = CompressionType.GZIP,
  ): Promise<{ compressed: Buffer; size: number }> {
    if (type === CompressionType.NONE) {
      const buffer = typeof data === 'string' ? Buffer.from(data) : data;
      return { compressed: buffer, size: buffer.length };
    }

    const buffer = typeof data === 'string' ? Buffer.from(data) : data;

    return new Promise((resolve, reject) => {
      if (type === CompressionType.GZIP) {
        const gzip = createGzip();
        let compressed = Buffer.alloc(0);

        gzip.on('data', (chunk) => {
          compressed = Buffer.concat([compressed, chunk]);
        });

        gzip.on('end', () => {
          resolve({ compressed, size: buffer.length });
        });

        gzip.on('error', reject);
        gzip.end(buffer);
      } else if (type === CompressionType.BROTLI) {
        const brotli = createBrotliCompress();
        let compressed = Buffer.alloc(0);

        brotli.on('data', (chunk) => {
          compressed = Buffer.concat([compressed, chunk]);
        });

        brotli.on('end', () => {
          resolve({ compressed, size: buffer.length });
        });

        brotli.on('error', reject);
        brotli.end(buffer);
      }
    });
  }

  /**
   * Decompress data that was compressed with the specified type
   */
  async decompress(
    compressedData: Buffer,
    type: CompressionType = CompressionType.GZIP,
  ): Promise<Buffer> {
    if (type === CompressionType.NONE) {
      return compressedData;
    }

    return new Promise((resolve, reject) => {
      if (type === CompressionType.GZIP) {
        gunzip(compressedData, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      } else if (type === CompressionType.BROTLI) {
        const decompressor = createBrotliDecompress();
        let decompressed = Buffer.alloc(0);

        decompressor.on('data', (chunk) => {
          decompressed = Buffer.concat([decompressed, chunk]);
        });

        decompressor.on('end', () => {
          resolve(decompressed);
        });

        decompressor.on('error', reject);
        decompressor.end(compressedData);
      }
    });
  }

  /**
   * Calculate compression ratio
   */
  calculateCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 10000) / 100;
  }

  /**
   * Get recommended compression type based on data size
   */
  getRecommendedCompressionType(dataSize: number): CompressionType {
    // For very small data, no compression
    if (dataSize < 1024) {
      return CompressionType.NONE;
    }
    // For large data, use Brotli (better compression ratio but slower)
    if (dataSize > 1024 * 1024) {
      return CompressionType.BROTLI;
    }
    // Default to GZIP
    return CompressionType.GZIP;
  }
}
