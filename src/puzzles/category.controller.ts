import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CategoriesService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryFilterDto, CategoryAnalyticsDto } from './dto/category-filter.dto';
import { Category } from './entities/category.entity';
import { Puzzle } from './entities/puzzle.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get('hierarchy')
  getHierarchy(): Promise<Category[]> {
    return this.categoriesService.getHierarchy();
  }

  @Get('recommendations')
  getRecommendations(
    @Query('limit') limit?: number,
  ): Promise<Category[]> {
    return this.categoriesService.getRecommendations(limit ? Number(limit) : 5);
  }

  @Get()
  findAll(@Query() filter: CategoryFilterDto): Promise<Category[]> {
    return this.categoriesService.findAll(filter);
  }

  @Get(':id/analytics')
  getAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CategoryAnalyticsDto[]> {
    return this.categoriesService.getCategoryAnalytics(id);
  }

  @Get(':id/puzzles')
  findCategoryPuzzles(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filter: CategoryFilterDto,
  ): Promise<Puzzle[]> {
    return this.categoriesService.searchPuzzlesByCategory(id, filter);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }
}
