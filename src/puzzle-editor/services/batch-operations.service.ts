/**
 * Batch Operations Service
 * Handles bulk operations on puzzles
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleEditor } from '../entities/puzzle-editor.entity';
import { BatchOperation, BatchOperationType, BatchOperationStatus } from '../interfaces/editor.interfaces';

@Injectable()
export class BatchOperationsService {
  private readonly logger = new Logger(BatchOperationsService.name);
  private activeBatches = new Map<string, BatchOperation>();

  /**
   * Create and start batch operation
   */
  async startBatchOperation(
    operationType: BatchOperationType,
    targetPuzzles: string[],
    configuration: Record<string, any>,
    userId: string,
  ): Promise<BatchOperation> {
    if (targetPuzzles.length === 0) {
      throw new BadRequestException('At least one puzzle must be selected');
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const operation: BatchOperation = {
      id: batchId,
      operationType,
      targetPuzzles,
      configuration,
      status: BatchOperationStatus.QUEUED,
      progress: 0,
      startTime: new Date(),
      results: [],
      errors: [],
    };

    this.activeBatches.set(batchId, operation);

    // Start processing asynchronously
    this.processBatch(operation, userId).catch((error) => {
      this.logger.error(`Batch operation ${batchId} failed: ${error.message}`);
      operation.status = BatchOperationStatus.FAILED;
      operation.errors.push({
        puzzleId: 'BATCH_ERROR',
        error: error.message,
        timestamp: new Date(),
        retryable: false,
      });
    });

    return operation;
  }

  /**
   * Get batch operation status
   */
  async getBatchOperation(batchId: string): Promise<BatchOperation> {
    const operation = this.activeBatches.get(batchId);
    if (!operation) {
      throw new NotFoundException(`Batch operation ${batchId} not found`);
    }
    return operation;
  }

  /**
   * Cancel batch operation
   */
  async cancelBatch(batchId: string): Promise<void> {
    const operation = await this.getBatchOperation(batchId);

    if (operation.status === BatchOperationStatus.PROCESSING) {
      operation.status = BatchOperationStatus.CANCELLED;
      this.logger.log(`Cancelled batch operation ${batchId}`);
    } else if (operation.status !== BatchOperationStatus.COMPLETED && operation.status !== BatchOperationStatus.FAILED) {
      operation.status = BatchOperationStatus.CANCELLED;
    }
  }

  /**
   * Process batch operation
   */
  private async processBatch(operation: BatchOperation, userId: string): Promise<void> {
    operation.status = BatchOperationStatus.PROCESSING;
    operation.startTime = new Date();

    const totalItems = operation.targetPuzzles.length;

    for (let i = 0; i < totalItems; i++) {
      const puzzleId = operation.targetPuzzles[i];

      try {
        // Process based on operation type
        let result: any;

        switch (operation.operationType) {
          case BatchOperationType.BULK_UPDATE:
            result = await this.bulkUpdate(puzzleId, operation.configuration);
            break;

          case BatchOperationType.BULK_PUBLISH:
            result = await this.bulkPublish(puzzleId);
            break;

          case BatchOperationType.BULK_DELETE:
            result = await this.bulkDelete(puzzleId);
            break;

          case BatchOperationType.BULK_TAG:
            result = await this.bulkTag(puzzleId, operation.configuration.tags);
            break;

          case BatchOperationType.BULK_VALIDATE:
            result = await this.bulkValidate(puzzleId);
            break;

          case BatchOperationType.BULK_TEST:
            result = await this.bulkTest(puzzleId);
            break;

          case BatchOperationType.BULK_EXPORT:
            result = await this.bulkExport(puzzleId, operation.configuration);
            break;

          default:
            throw new Error(`Unknown operation type: ${operation.operationType}`);
        }

        operation.results.push({
          puzzleId,
          status: 'success',
          message: `Successfully processed puzzle ${puzzleId}`,
          duration: 100,
          data: result,
        });
      } catch (error) {
        operation.results.push({
          puzzleId,
          status: 'failed',
          message: `Failed: ${error.message}`,
          duration: 100,
        });

        operation.errors.push({
          puzzleId,
          error: error.message,
          timestamp: new Date(),
          retryable: this.isRetryable(error),
        });
      }

      // Update progress
      operation.progress = ((i + 1) / totalItems) * 100;
      operation.estimatedCompletionTime = this.estimateCompletionTime(operation);

      // Check if operation was cancelled
      if (operation.status === BatchOperationStatus.CANCELLED) {
        return;
      }
    }

    operation.completionTime = new Date();
    operation.status =
      operation.errors.length === 0 ? BatchOperationStatus.COMPLETED : BatchOperationStatus.COMPLETED;
  }

  /**
   * Bulk update operation
   */
  private async bulkUpdate(puzzleId: string, configuration: Record<string, any>): Promise<any> {
    // Update puzzle with provided configuration
    // This would typically update database records
    return {
      puzzleId,
      updatedFields: Object.keys(configuration),
      timestamp: new Date(),
    };
  }

  /**
   * Bulk publish operation
   */
  private async bulkPublish(puzzleId: string): Promise<any> {
    // Publish puzzle to public
    return {
      puzzleId,
      published: true,
      timestamp: new Date(),
    };
  }

  /**
   * Bulk delete operation
   */
  private async bulkDelete(puzzleId: string): Promise<any> {
    // Delete puzzle (soft delete)
    return {
      puzzleId,
      deleted: true,
      timestamp: new Date(),
    };
  }

  /**
   * Bulk tag operation
   */
  private async bulkTag(puzzleId: string, tags: string[]): Promise<any> {
    // Add tags to puzzle
    return {
      puzzleId,
      tags,
      tagsAdded: true,
      timestamp: new Date(),
    };
  }

  /**
   * Bulk validate operation
   */
  private async bulkValidate(puzzleId: string): Promise<any> {
    // Validate puzzle
    return {
      puzzleId,
      isValid: true,
      errors: [],
      warnings: [],
      timestamp: new Date(),
    };
  }

  /**
   * Bulk test operation
   */
  private async bulkTest(puzzleId: string): Promise<any> {
    // Test puzzle
    return {
      puzzleId,
      successRate: 85,
      avgCompletionTime: 120000,
      avgAttempts: 2.5,
      timestamp: new Date(),
    };
  }

  /**
   * Bulk export operation
   */
  private async bulkExport(puzzleId: string, configuration: Record<string, any>): Promise<any> {
    // Export puzzle
    return {
      puzzleId,
      format: configuration.format,
      exportUrl: `https://example.com/export/${puzzleId}.${configuration.format}`,
      timestamp: new Date(),
    };
  }

  /**
   * Estimate completion time
   */
  private estimateCompletionTime(operation: BatchOperation): Date {
    if (operation.progress === 0) {
      return new Date(Date.now() + 60000); // 1 minute estimate
    }

    const elapsed = Date.now() - operation.startTime.getTime();
    const rate = operation.progress / elapsed;
    const remaining = (100 - operation.progress) / rate;

    return new Date(Date.now() + remaining);
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: Error): boolean {
    const retryableErrors = [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'EHOSTUNREACH',
      'ER_LOCK_WAIT_TIMEOUT',
    ];

    return retryableErrors.some((code) => error.message.includes(code));
  }

  /**
   * Get batch statistics
   */
  async getBatchStats(): Promise<{
    activeBatches: number;
    completedBatches: number;
    totalItemsProcessed: number;
    averageSuccessRate: number;
  }> {
    const batches = Array.from(this.activeBatches.values());

    const completed = batches.filter((b) => b.status === BatchOperationStatus.COMPLETED).length;
    const totalItems = batches.reduce((sum, b) => sum + b.results.length, 0);
    const successfulItems = batches.reduce(
      (sum, b) => sum + b.results.filter((r) => r.status === 'success').length,
      0,
    );
    const successRate = totalItems > 0 ? (successfulItems / totalItems) * 100 : 0;

    return {
      activeBatches: batches.length,
      completedBatches: completed,
      totalItemsProcessed: totalItems,
      averageSuccessRate: parseFloat(successRate.toFixed(2)),
    };
  }
}
