import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { PlayerService } from './player.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TrackProgressDto } from './dto/track-progress.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlayerDataPortabilityService } from './player-data-portability.service';
import {
  CreateExportScheduleDto,
  ExportRequestDto,
  ValidateImportDto,
} from './dto/data-portability.dto';
import { ExportFormat } from './data-portability.types';

@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
    private readonly portabilityService: PlayerDataPortabilityService,
  ) {}

  @Get('profile')
  getProfile(@Request() req) {
    return this.playerService.getProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.playerService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('progress')
  trackProgress(@Request() req, @Body() trackProgressDto: TrackProgressDto) {
    return this.playerService.trackProgress(req.user.id, trackProgressDto);
  }

  @Get('progress')
  getProgressHistory(@Request() req) {
    return this.playerService.getProgressHistory(req.user.id);
  }

  @Get('statistics')
  getStatistics(@Request() req) {
    return this.playerService.getStatistics(req.user.id);
  }

  @Get('export')
  async exportData(
    @Request() req,
    @Query('format') format: ExportFormat = ExportFormat.JSON,
    @Res() response: Response,
  ) {
    const exportFile = await this.portabilityService.createEncryptedExport(
      req.user.id,
      format,
    );
    response.setHeader('Content-Type', 'application/json');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="player-data-${format}.encrypted.json"`,
    );
    response.send(exportFile);
  }

  @Post('export/email')
  @HttpCode(202)
  emailExport(@Request() req, @Body() body: ExportRequestDto) {
    return this.portabilityService.sendExportEmail(req.user.id, body.format);
  }

  @Post('export-schedules')
  createExportSchedule(@Request() req, @Body() body: CreateExportScheduleDto) {
    return this.portabilityService.createSchedule(
      req.user.id,
      body.format,
      body.cadence,
    );
  }

  @Get('export-schedules')
  listExportSchedules(@Request() req) {
    return this.portabilityService.listSchedules(req.user.id);
  }

  @Delete('export-schedules/:id')
  @HttpCode(204)
  deleteExportSchedule(@Request() req, @Param('id') scheduleId: string) {
    return this.portabilityService.deleteSchedule(req.user.id, scheduleId);
  }

  @Post('imports/validate')
  validateImport(@Body() body: ValidateImportDto) {
    return this.portabilityService.validateImport(body.data);
  }

  @Delete('deactivate')
  deactivatePlayer(@Request() req) {
    return this.playerService.deactivatePlayer(req.user.id);
  }
}
