/**
 * Batch Operations Controller
 * Handles bulk operations on puzzles
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BatchOperationsService } from '../services/batch-operations.service';
import { BatchOperationDto } from '../dto';

@ApiTags('Batch Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('batch-operations')
export class BatchOperationsController {
  constructor(private batchService: BatchOperationsService) {}

  /**
   * Start batch operation
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start a batch operation' })
  @ApiResponse({ status: 202, description: 'Batch operation started' })
  async startBatchOperation(@Body() dto: BatchOperationDto, @Request() req: any) {
    return this.batchService.startBatchOperation(
      dto.operationType as any,
      dto.targetPuzzles,
      dto.configuration || {},
      req.user.id,
    );
  }

  /**
   * Get batch operation status
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get batch operation status' })
  @ApiResponse({ status: 200, description: 'Batch operation status' })
  async getBatchOperation(@Param('id') id: string) {
    return this.batchService.getBatchOperation(id);
  }

  /**
   * Cancel batch operation
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel batch operation' })
  @ApiResponse({ status: 204, description: 'Batch operation cancelled' })
  async cancelBatch(@Param('id') id: string) {
    await this.batchService.cancelBatch(id);
  }

  /**
   * Get batch statistics
   */
  @Get('/statistics/overview')
  @ApiOperation({ summary: 'Get batch operation statistics' })
  @ApiResponse({ status: 200, description: 'Batch statistics' })
  async getBatchStats() {
    return this.batchService.getBatchStats();
  }
}
