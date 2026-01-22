import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ThemesService } from './theme.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { Theme } from './entities/theme.entity';

@Controller('themes') // Base path for theme API
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Post()
  create(@Body() createThemeDto: CreateThemeDto): Promise<Theme> {
    return this.themesService.create(createThemeDto);
  }

  @Get()
  findAll(): Promise<Theme[]> {
    return this.themesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Theme> {
    return this.themesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateThemeDto: UpdateThemeDto,
  ): Promise<Theme> {
    return this.themesService.update(id, updateThemeDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.themesService.remove(id);
  }

  // Optional: Endpoints to manage themes associated with collections
  // @Post(':id/collections/:collectionId')
  // addCollectionToTheme(@Param('id', ParseUUIDPipe) themeId: string, @Param('collectionId', ParseUUIDPipe) collectionId: string): Promise<Theme> {
  //   return this.themesService.addCollection(themeId, collectionId);
  // }

  // @Delete(':id/collections/:collectionId')
  // removeCollectionFromTheme(@Param('id', ParseUUIDPipe) themeId: string, @Param('collectionId', ParseUUIDPipe) collectionId: string): Promise<Theme> {
  //   return this.themesService.removeCollection(themeId, collectionId);
  // }
}
