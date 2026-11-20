import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
  HttpStatus,
  HttpCode,
  Req,
  UseInterceptors,
  UploadedFile,
  Optional,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/constants';
import { PuzzlesService } from '../../puzzles/puzzles.service';
import { PuzzleBulkImportService } from '../../puzzles/services/puzzle-bulk-import.service';
import {
  CreatePuzzleDto,
  UpdatePuzzleDto,
  SearchPuzzleDto,
  BulkImportPuzzlesDto,
} from '../../puzzles/dto';
import { AdminAuditLogService } from '../services/admin-audit-log.service';
import { ActiveUser } from '../../auth/decorators/active-user.decorator';

@Controller('admin/puzzles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPuzzlesController {
  constructor(
    private readonly puzzlesService: PuzzlesService,
    private readonly auditLogService: AdminAuditLogService,
    @Optional()
    private readonly bulkImportService?: PuzzleBulkImportService,
  ) {}

  @Get()
  async findAll(@Query() searchDto: SearchPuzzleDto) {
    return await this.puzzlesService.findAll(searchDto);
  }

  @Post()
  async create(
    @Body() createPuzzleDto: CreatePuzzleDto,
    @ActiveUser() user: any,
  ) {
    const puzzle = await this.puzzlesService.create(createPuzzleDto, user.id);
    await this.auditLogService.log({
      adminId: user.id,
      action: 'CREATE_PUZZLE',
      targetType: 'PUZZLE',
      targetId: puzzle.id,
      details: { title: puzzle.title },
    });
    return puzzle;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePuzzleDto: UpdatePuzzleDto,
    @ActiveUser() user: any,
  ) {
    const puzzle = await this.puzzlesService.update(
      id,
      updatePuzzleDto,
      user.id,
    );
    await this.auditLogService.log({
      adminId: user.id,
      action: 'UPDATE_PUZZLE',
      targetType: 'PUZZLE',
      targetId: id,
      details: updatePuzzleDto,
    });
    return puzzle;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() user: any,
  ) {
    await this.puzzlesService.remove(id, user.id);
    await this.auditLogService.log({
      adminId: user.id,
      action: 'DELETE_PUZZLE',
      targetType: 'PUZZLE',
      targetId: id,
    });
  }

  @Post(':id/archive')
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() user: any,
  ) {
    const puzzle = await this.puzzlesService.archive(id, user.id);
    await this.auditLogService.log({
      adminId: user.id,
      action: 'ARCHIVE_PUZZLE',
      targetType: 'PUZZLE',
      targetId: id,
      details: { title: puzzle.title },
    });
    return puzzle;
  }

  @Post(':id/restore')
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() user: any,
  ) {
    const puzzle = await this.puzzlesService.restore(id, user.id);
    await this.auditLogService.log({
      adminId: user.id,
      action: 'RESTORE_PUZZLE',
      targetType: 'PUZZLE',
      targetId: id,
      details: {
        title: puzzle.title,
        restoredAt: new Date(),
        restoredBy: user.id,
      },
    });
    return puzzle;
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importPuzzles(
    @UploadedFile() file: any,
    @Body() body: BulkImportPuzzlesDto,
    @ActiveUser() user: any,
  ) {
    const dryRun = body?.dryRun === true || String(body?.dryRun) === 'true';
    return await this.bulkImportService.importFromFile(
      file,
      body,
      user.id,
      dryRun,
    );
  }

  @Post('bulk-import')
  @UseInterceptors(FileInterceptor('file'))
  async bulkImportPuzzles(
    @UploadedFile() file: any,
    @Body() body: BulkImportPuzzlesDto,
    @ActiveUser() user: any,
  ) {
    return this.importPuzzles(file, body, user);
  }

  @Get('import/history')
  async getImportHistory(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return await this.bulkImportService.getImportHistory(
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    );
  }

  @Get('import/history/:id')
  async getImportHistoryById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.bulkImportService.getImportHistoryById(id);
  }
}
