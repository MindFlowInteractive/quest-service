import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import {
  CreateSmsTemplateDto,
  RenderSmsTemplateDto,
  UpdateSmsTemplateDto,
} from './dto';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(@Body() dto: CreateSmsTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Get()
  findAll() {
    return this.templatesService.findAll();
  }

  @Get('name/:name')
  findByName(@Param('name') name: string) {
    return this.templatesService.findByName(name);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSmsTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.templatesService.remove(id);
  }

  @Post('render')
  render(@Body() dto: RenderSmsTemplateDto) {
    return this.templatesService.render(dto);
  }

  @Post(':id/preview')
  preview(@Param('id') id: string, @Body('variables') variables: Record<string, any>) {
    return this.templatesService.preview(id, variables || {});
  }
}
