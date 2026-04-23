import { Controller, Get, Post, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { BlockchainEventsService } from './blockchain-events.service';

@ApiTags('blockchain-events')
@Controller('admin/sync')
export class BlockchainEventsController {
  constructor(private readonly blockchainEventsService: BlockchainEventsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get blockchain sync status' })
  @ApiResponse({
    status: 200,
    description: 'Sync status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        lastSyncedLedger: { type: 'number', description: 'Last processed ledger number' },
        eventsProcessedToday: { type: 'number', description: 'Number of events processed today' },
        errorCount: { type: 'number', description: 'Number of errors today' },
        registeredContracts: { type: 'array', items: { type: 'string' }, description: 'Registered contract addresses' },
      },
    },
  })
  async getSyncStatus() {
    return await this.blockchainEventsService.getSyncStatus();
  }

  @Post('replay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Replay events from a specific ledger range' })
  @ApiQuery({ name: 'fromLedger', required: true, type: 'number', description: 'Starting ledger number' })
  @ApiQuery({ name: 'toLedger', required: false, type: 'number', description: 'Ending ledger number (optional)' })
  @ApiResponse({
    status: 200,
    description: 'Event replay completed',
    schema: {
      type: 'object',
      properties: {
        replayed: { type: 'number', description: 'Number of events successfully replayed' },
        errors: { type: 'number', description: 'Number of errors during replay' },
      },
    },
  })
  async replayEvents(
    @Query('fromLedger') fromLedger: number,
    @Query('toLedger') toLedger?: number,
  ) {
    return await this.blockchainEventsService.replayEvents(fromLedger, toLedger);
  }
}
