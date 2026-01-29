import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StateSnapshotService } from '../services/state-snapshot.service';
import { CreateSnapshotDto } from '../dto/create-snapshot.dto';

@Controller('state')
export class StateController {
  constructor(
    private readonly stateSnapshotService: StateSnapshotService,
  ) {}

  @Post('snapshots')
  @HttpCode(HttpStatus.CREATED)
  async createSnapshot(@Body() dto: CreateSnapshotDto) {
    const snapshot = await this.stateSnapshotService.createSnapshot(dto);
    return {
      message: 'Snapshot created successfully',
      snapshot,
    };
  }

  @Get('snapshots/session/:sessionId')
  async getSnapshotsBySession(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: number,
  ) {
    const snapshots = await this.stateSnapshotService.getSnapshotsBySession(
      sessionId,
      limit ? parseInt(limit.toString(), 10) : 50,
    );
    return {
      message: 'Snapshots retrieved successfully',
      snapshots,
      count: snapshots.length,
    };
  }

  @Get('snapshots/session/:sessionId/latest')
  async getLastSnapshot(@Param('sessionId') sessionId: string) {
    const snapshot = await this.stateSnapshotService.getLastSnapshot(sessionId);
    return {
      message: 'Latest snapshot retrieved successfully',
      snapshot,
    };
  }

  @Get('snapshots/session/:sessionId/restore-points')
  async getRestorePoints(@Param('sessionId') sessionId: string) {
    const restorePoints =
      await this.stateSnapshotService.getRestorePoints(sessionId);
    return {
      message: 'Restore points retrieved successfully',
      restorePoints,
      count: restorePoints.length,
    };
  }

  @Get('snapshots/:snapshotId')
  async getSnapshotById(@Param('snapshotId') snapshotId: string) {
    const snapshot = await this.stateSnapshotService.getSnapshotById(
      snapshotId,
    );
    return {
      message: 'Snapshot retrieved successfully',
      snapshot,
    };
  }

  @Post('snapshots/:snapshotId/restore')
  async restoreToSnapshot(@Param('snapshotId') snapshotId: string) {
    const snapshot = await this.stateSnapshotService.restoreToSnapshot(
      snapshotId,
    );
    return {
      message: 'Snapshot restored successfully',
      snapshot,
    };
  }

  @Post('snapshots/checkpoint')
  @HttpCode(HttpStatus.CREATED)
  async createCheckpoint(
    @Body()
    dto: {
      sessionId: string;
      checkpointName: string;
      state: Record<string, any>;
    },
  ) {
    const snapshot = await this.stateSnapshotService.createCheckpoint(
      dto.sessionId,
      dto.checkpointName,
      dto.state,
    );
    return {
      message: 'Checkpoint created successfully',
      snapshot,
    };
  }
}
