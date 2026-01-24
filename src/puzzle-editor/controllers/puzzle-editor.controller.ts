/**
 * Puzzle Editor Controller
 * Handles puzzle editor API endpoints
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PuzzleEditorService } from '../services/puzzle-editor.service';
import { PuzzleValidationService } from '../services/puzzle-validation.service';
import { PuzzleImportExportService } from '../services/puzzle-import-export.service';
import {
  CreatePuzzleEditorDto,
  UpdatePuzzleEditorDto,
  SaveEditorStateDto,
  PublishPuzzleEditorDto,
  SearchPuzzleEditorsDto,
  ValidatePuzzleDto,
  ExportPuzzleDto,
  ImportPuzzleDto,
  AddCollaboratorDto,
  RemoveCollaboratorDto,
  CreateVersionDto,
  RestoreVersionDto,
} from '../dto';

@ApiTags('Puzzle Editor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('puzzle-editor')
export class PuzzleEditorController {
  constructor(
    private editorService: PuzzleEditorService,
    private validationService: PuzzleValidationService,
    private importExportService: PuzzleImportExportService,
  ) {}

  /**
   * Create new puzzle editor
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new puzzle editor' })
  @ApiResponse({
    status: 201,
    description: 'Puzzle editor created successfully',
  })
  async create(@Body() dto: CreatePuzzleEditorDto, @Request() req: any) {
    return this.editorService.createEditor(dto, req.user.id);
  }

  /**
   * Get puzzle editor by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get puzzle editor by ID' })
  @ApiResponse({ status: 200, description: 'Puzzle editor retrieved' })
  async getEditor(@Param('id') id: string, @Request() req: any) {
    return this.editorService.getEditor(id, req.user.id);
  }

  /**
   * Update puzzle editor
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update puzzle editor' })
  @ApiResponse({ status: 200, description: 'Puzzle editor updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePuzzleEditorDto,
    @Request() req: any,
  ) {
    return this.editorService.updateEditor(id, dto, req.user.id);
  }

  /**
   * Delete puzzle editor
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete puzzle editor' })
  @ApiResponse({ status: 204, description: 'Puzzle editor deleted' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.editorService.deleteEditor(id, req.user.id);
  }

  /**
   * Search puzzle editors
   */
  @Get()
  @ApiOperation({ summary: 'Search puzzle editors' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async search(@Query() dto: SearchPuzzleEditorsDto, @Request() req: any) {
    return this.editorService.searchEditors(dto, req.user.id);
  }

  /**
   * Save editor state
   */
  @Post(':id/save')
  @ApiOperation({ summary: 'Save editor state' })
  @ApiResponse({ status: 200, description: 'Editor state saved' })
  async saveState(
    @Param('id') id: string,
    @Body() dto: SaveEditorStateDto,
    @Request() req: any,
  ) {
    return this.editorService.saveEditorState(id, dto, req.user.id);
  }

  /**
   * Validate puzzle
   */
  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate puzzle' })
  @ApiResponse({ status: 200, description: 'Validation results returned' })
  async validate(
    @Param('id') id: string,
    @Body() dto: ValidatePuzzleDto,
    @Request() req: any,
  ) {
    const editor = await this.editorService.getEditor(id, req.user.id);

    const validationResult = await this.validationService.validatePuzzle(
      editor.components,
      editor.connections,
    );

    if (dto.autoFix) {
      // Auto-fix components
      const fixed = await Promise.all(
        editor.components.map((c) => this.validationService.autoFixComponent(c)),
      );
      await this.editorService.updateEditor(id, { components: fixed }, req.user.id);
    }

    return validationResult;
  }

  /**
   * Publish puzzle
   */
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish puzzle to game' })
  @ApiResponse({ status: 200, description: 'Puzzle published' })
  async publish(
    @Param('id') id: string,
    @Body() dto: PublishPuzzleEditorDto,
    @Request() req: any,
  ) {
    return this.editorService.publishPuzzle(id, dto, req.user.id);
  }

  /**
   * Export puzzle
   */
  @Post(':id/export')
  @ApiOperation({ summary: 'Export puzzle in specified format' })
  @ApiResponse({ status: 200, description: 'Puzzle exported successfully' })
  async export(
    @Param('id') id: string,
    @Body() dto: ExportPuzzleDto,
    @Request() req: any,
  ) {
    const editor = await this.editorService.getEditor(id, req.user.id);

    const exportedData = await this.importExportService.exportPuzzle(
      {
        id: editor.id,
        components: editor.components,
        connections: editor.connections,
        history: [],
        historyIndex: 0,
        isDirty: false,
        metadata: editor.editorMetadata,
        selectedComponent: undefined,
        clipboard: undefined,
      },
      {
        format: dto.format as any,
        version: '1.0',
        includeMetadata: dto.includeMetadata || false,
        includeVersionHistory: dto.includeVersionHistory || false,
        includeCollaborators: dto.includeCollaborators || false,
      },
      editor.metadata,
    );

    return {
      format: dto.format,
      data: exportedData,
      exportedAt: new Date(),
    };
  }

  /**
   * Import puzzle
   */
  @Post(':id/import')
  @ApiOperation({ summary: 'Import puzzle from file' })
  @ApiResponse({ status: 200, description: 'Puzzle imported successfully' })
  async import(
    @Param('id') id: string,
    @Body() dto: ImportPuzzleDto,
    @Request() req: any,
  ) {
    const editor = await this.editorService.getEditor(id, req.user.id);

    const importedState = await this.importExportService.importPuzzle(dto.data, {
      format: dto.format as any,
      mergeDuplicates: dto.mergeDuplicates || false,
      updateExisting: dto.updateExisting || false,
      validateOnImport: dto.validateOnImport || true,
      autoCreateMissingDependencies: false,
    });

    await this.editorService.updateEditor(
      id,
      {
        components: importedState.components,
        connections: importedState.connections,
      },
      req.user.id,
    );

    return {
      success: true,
      importedComponentCount: importedState.components.length,
      importedConnectionCount: importedState.connections.length,
    };
  }

  /**
   * Add collaborator
   */
  @Post(':id/collaborators')
  @ApiOperation({ summary: 'Add collaborator to puzzle editor' })
  @ApiResponse({ status: 200, description: 'Collaborator added' })
  async addCollaborator(
    @Param('id') id: string,
    @Body() dto: AddCollaboratorDto,
    @Request() req: any,
  ) {
    return this.editorService.addCollaborator(id, dto.userId, req.user.id);
  }

  /**
   * Remove collaborator
   */
  @Delete(':id/collaborators/:userId')
  @ApiOperation({ summary: 'Remove collaborator from puzzle editor' })
  @ApiResponse({ status: 204, description: 'Collaborator removed' })
  async removeCollaborator(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    await this.editorService.removeCollaborator(id, userId, req.user.id);
  }

  /**
   * Create version
   */
  @Post(':id/versions')
  @ApiOperation({ summary: 'Create a version snapshot' })
  @ApiResponse({ status: 201, description: 'Version created' })
  async createVersion(
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
    @Request() req: any,
  ) {
    return this.editorService.createVersion(id, dto, req.user.id);
  }

  /**
   * Get version history
   */
  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history' })
  @ApiResponse({ status: 200, description: 'Version history retrieved' })
  async getVersionHistory(@Param('id') id: string, @Request() req: any) {
    return this.editorService.getVersionHistory(id, req.user.id);
  }

  /**
   * Restore version
   */
  @Post(':id/versions/:versionId/restore')
  @ApiOperation({ summary: 'Restore from specific version' })
  @ApiResponse({ status: 200, description: 'Version restored' })
  async restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Request() req: any,
  ) {
    return this.editorService.restoreVersion(id, versionId, req.user.id);
  }
}
