import { Controller, Post, Body, Get, Param, Query, Put, Delete } from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly svc: CollectionsService) {}

  @Post()
  create(@Body() dto: any) {
    return this.svc.createCategory(dto);
  }

  @Get()
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.svc.listCategories(Number(page) || 0, Number(limit) || 50);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getCategoryById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateCategory(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.deleteCategory(id);
  }
}
