/**
 * Puzzle Template Controller
 * Handles puzzle template endpoints
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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PuzzleTemplateService } from '../services/puzzle-template.service';
import { PuzzleEditorService } from '../services/puzzle-editor.service';
import { CreateTemplateDto, UseTemplateDto } from '../dto';

@ApiTags('Puzzle Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('puzzle-templates')
export class PuzzleTemplateController {
  constructor(
    private templateService: PuzzleTemplateService,
    private editorService: PuzzleEditorService,
  ) {}

  /**
   * Create template
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new puzzle template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  async createTemplate(@Body() dto: CreateTemplateDto, @Request() req: any) {
    return this.templateService.createTemplate(dto, req.user.id);
  }

  /**
   * Get template by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved' })
  async getTemplate(@Param('id') id: string) {
    return this.templateService.getTemplate(id);
  }

  /**
   * Get all templates
   */
  @Get()
  @ApiOperation({ summary: 'Get all templates with filters' })
  @ApiResponse({ status: 200, description: 'Templates list' })
  async getAllTemplates(
    @Query('puzzleType') puzzleType?: string,
    @Query('difficulty') difficulty?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.templateService.getAllTemplates({
      puzzleType,
      difficulty,
      category,
      search,
      page,
      limit,
    });
  }

  /**
   * Get popular templates
   */
  @Get('/popular/list')
  @ApiOperation({ summary: 'Get popular templates' })
  @ApiResponse({ status: 200, description: 'Popular templates' })
  async getPopularTemplates(@Query('limit') limit: number = 10) {
    return this.templateService.getPopularTemplates(limit);
  }

  /**
   * Get templates by type
   */
  @Get('/by-type/:puzzleType')
  @ApiOperation({ summary: 'Get templates by puzzle type' })
  @ApiResponse({ status: 200, description: 'Templates by type' })
  async getByType(@Param('puzzleType') puzzleType: string, @Query('limit') limit: number = 10) {
    return this.templateService.getTemplatesByType(puzzleType, limit);
  }

  /**
   * Get categories
   */
  @Get('/categories/list')
  @ApiOperation({ summary: 'Get all template categories' })
  @ApiResponse({ status: 200, description: 'Categories list' })
  async getCategories() {
    return this.templateService.getCategories();
  }

  /**
   * Get template statistics
   */
  @Get('/statistics/overview')
  @ApiOperation({ summary: 'Get template statistics' })
  @ApiResponse({ status: 200, description: 'Template statistics' })
  async getStats() {
    return this.templateService.getTemplateStats();
  }

  /**
   * Rate template
   */
  @Post(':id/rate')
  @ApiOperation({ summary: 'Rate a template' })
  @ApiResponse({ status: 200, description: 'Template rated' })
  async rateTemplate(
    @Param('id') id: string,
    @Body('rating') rating: number,
    @Request() req: any,
  ) {
    return this.templateService.rateTemplate(id, rating);
  }

  /**
   * Use template to create editor
   */
  @Post(':id/use')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Use template to create new puzzle editor' })
  @ApiResponse({ status: 201, description: 'Editor created from template' })
  async useTemplate(
    @Param('id') id: string,
    @Body() dto: { title: string; description?: string },
    @Request() req: any,
  ) {
    return this.editorService.createEditor(
      {
        title: dto.title,
        description: dto.description,
        templateId: id,
      },
      req.user.id,
    );
  }

  /**
   * Update template
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() updates: Partial<CreateTemplateDto>,
    @Request() req: any,
  ) {
    return this.templateService.updateTemplate(id, updates as any, req.user.id);
  }

  /**
   * Delete template
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 204, description: 'Template deleted' })
  async deleteTemplate(@Param('id') id: string, @Request() req: any) {
    await this.templateService.deleteTemplate(id, req.user.id);
  }
}
