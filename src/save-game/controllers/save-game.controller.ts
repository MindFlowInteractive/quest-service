import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SaveGameService } from '../services/save-game.service';
import { CloudSyncService } from '../services/cloud-sync.service';
import { AutoSaveService } from '../services/auto-save.service';
import { SaveBackupService } from '../services/save-backup.service';
import { SaveAnalyticsService } from '../services/save-analytics.service';
import { CreateSaveGameDto } from '../dto/create-save-game.dto';
import { UpdateSaveGameDto } from '../dto/update-save-game.dto';
import {
  SyncSaveGameDto,
  ResolveConflictDto,
  BatchSyncDto,
} from '../dto/sync-save-game.dto';
import { SaveGameDataDto } from '../dto/create-save-game.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@Controller('save-games')
@UseGuards(JwtAuthGuard)
export class SaveGameController {
  constructor(
    private readonly saveGameService: SaveGameService,
    private readonly cloudSyncService: CloudSyncService,
    private readonly autoSaveService: AutoSaveService,
    private readonly backupService: SaveBackupService,
    private readonly analyticsService: SaveAnalyticsService,
  ) {}

  // ============ Save Game CRUD ============

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateSaveGameDto,
  ) {
    return this.saveGameService.create(req.user.id, dto);
  }

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.saveGameService.findAll(req.user.id);
  }

  @Get('slots/empty')
  async getEmptySlots(
    @Request() req: AuthenticatedRequest,
    @Query('count', new ParseIntPipe({ optional: true })) count?: number,
  ) {
    return this.saveGameService.getEmptySlots(req.user.id, count || 10);
  }

  @Get(':slotId')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.saveGameService.findOne(req.user.id, slotId);
  }

  @Get(':slotId/load')
  async load(
    @Request() req: AuthenticatedRequest,
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.saveGameService.load(req.user.id, slotId);
  }

  @Put(':slotId')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() dto: UpdateSaveGameDto,
  ) {
    return this.saveGameService.update(req.user.id, slotId, dto);
  }

  @Delete(':slotId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Request() req: AuthenticatedRequest,
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    await this.saveGameService.delete(req.user.id, slotId);
  }

  // ============ Cloud Sync ============

  @Post('sync')
  async sync(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SyncSaveGameDto,
  ) {
    return this.cloudSyncService.syncSave(req.user.id, dto);
  }

  @Post('sync/batch')
  async batchSync(
    @Request() req: AuthenticatedRequest,
    @Body() dto: BatchSyncDto,
  ) {
    return this.cloudSyncService.batchSync(req.user.id, dto);
  }

  @Post('sync/resolve-conflict')
  async resolveConflict(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ResolveConflictDto,
  ) {
    return this.cloudSyncService.resolveConflict(req.user.id, dto);
  }

  @Post('sync/upload/:slotId')
  async uploadToCloud(
    @Request() req: AuthenticatedRequest,
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() data: SaveGameDataDto,
    @Query('deviceId') deviceId?: string,
    @Query('platform') platform?: string,
  ) {
    return this.cloudSyncService.uploadToCloud(
      req.user.id,
      slotId,
      data,
      deviceId,
      platform,
    );
  }

  @Get('sync/download/:slotId')
  async downloadFromCloud(
    @Request() req: AuthenticatedRequest,
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.cloudSyncService.downloadFromCloud(req.user.id, slotId);
  }

  @Get('cloud')
  async getCloudSaves(@Request() req: AuthenticatedRequest) {
    return this.cloudSyncService.getCloudSaves(req.user.id);
  }

  // ============ Auto-Save & Quick Save ============

  @Post('auto-save/enable')
  async enableAutoSave(
    @Request() req: AuthenticatedRequest,
    @Query('slotId', new ParseIntPipe({ optional: true })) slotId?: number,
    @Query('intervalMs', new ParseIntPipe({ optional: true })) intervalMs?: number,
  ) {
    await this.autoSaveService.enableAutoSave(req.user.id, slotId, intervalMs);
    return { enabled: true, slotId, intervalMs };
  }

  @Post('auto-save/disable')
  async disableAutoSave(
    @Request() req: AuthenticatedRequest,
    @Query('slotId', new ParseIntPipe({ optional: true })) slotId?: number,
  ) {
    await this.autoSaveService.disableAutoSave(req.user.id, slotId);
    return { enabled: false };
  }

  @Post('auto-save/trigger')
  async triggerAutoSave(
    @Request() req: AuthenticatedRequest,
    @Body() data: SaveGameDataDto,
  ) {
    return this.autoSaveService.triggerAutoSave(req.user.id, data);
  }

  @Get('auto-save/config')
  async getAutoSaveConfig(
    @Request() req: AuthenticatedRequest,
    @Query('slotId', new ParseIntPipe({ optional: true })) slotId?: number,
  ) {
    return this.autoSaveService.getAutoSaveConfig(req.user.id, slotId);
  }

  @Post('quick-save')
  async quickSave(
    @Request() req: AuthenticatedRequest,
    @Body() data: SaveGameDataDto,
  ) {
    return this.autoSaveService.quickSave(req.user.id, data);
  }

  @Get('quick-load')
  async quickLoad(@Request() req: AuthenticatedRequest) {
    return this.autoSaveService.quickLoad(req.user.id);
  }

  // ============ Backups ============

  @Get('backups')
  async getBackups(
    @Request() req: AuthenticatedRequest,
    @Query('slotId', new ParseIntPipe({ optional: true })) slotId?: number,
  ) {
    return this.backupService.getBackups(req.user.id, slotId);
  }

  @Post('backups/:backupId/restore')
  async restoreFromBackup(
    @Request() req: AuthenticatedRequest,
    @Param('backupId') backupId: string,
  ) {
    return this.backupService.restoreFromBackup(backupId, req.user.id);
  }

  @Delete('backups/:backupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBackup(
    @Request() req: AuthenticatedRequest,
    @Param('backupId') backupId: string,
  ) {
    await this.backupService.deleteBackup(backupId, req.user.id);
  }

  // ============ Analytics ============

  @Get('analytics')
  async getAnalytics(@Request() req: AuthenticatedRequest) {
    return this.analyticsService.getAnalytics(req.user.id);
  }
}
