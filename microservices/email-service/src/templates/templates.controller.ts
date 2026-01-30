import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto, RenderTemplateDto } from './dto';
import { TemplateCategory } from './entities/email-template.entity';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  async create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Get()
  async findAll(@Query('category') category?: TemplateCategory) {
    return this.templatesService.findAll(category);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Get('name/:name')
  async findByName(@Param('name') name: string) {
    return this.templatesService.findByName(name);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.templatesService.delete(id);
  }

  @Post('render')
  async render(@Body() dto: RenderTemplateDto) {
    return this.templatesService.render(dto);
  }

  @Post(':id/preview')
  async preview(
    @Param('id') id: string,
    @Body() body: { variables: Record<string, any> },
  ) {
    return this.templatesService.preview(id, body.variables);
  }

  @Post(':id/duplicate')
  async duplicate(
    @Param('id') id: string,
    @Body() body: { newName: string },
  ) {
    return this.templatesService.duplicate(id, body.newName);
  }
}
