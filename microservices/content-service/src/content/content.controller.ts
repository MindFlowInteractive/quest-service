import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ContentService } from './content.service.js';
import { CreateContentDto } from './dto/create-content.dto.js';
import { UpdateContentDto } from './dto/update-content.dto.js';
import { ContentFilterDto } from './dto/content-filter.dto.js';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  async create(@Body() createContentDto: CreateContentDto) {
    return this.contentService.create(createContentDto);
  }

  @Get()
  async findAll(
    @Query() filterDto: ContentFilterDto,
    @Headers('x-user-id') userId?: string,
  ) {
    if (userId) {
      return this.contentService.findByUser(userId, filterDto);
    }
    return this.contentService.findAll(filterDto);
  }

  @Get('discover')
  async discover(@Query() filterDto: ContentFilterDto) {
    return this.contentService.discover(filterDto);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const content = await this.contentService.findOne(id);

    if (content.userId !== userId && !content.isPublic) {
      return this.contentService.findPublicContent(id);
    }

    return content;
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContentDto: UpdateContentDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.contentService.update(id, userId, updateContentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-user-id') userId: string,
  ) {
    await this.contentService.delete(id, userId);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async like(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.incrementLikes(id);
    return { success: true };
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  async unlike(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.decrementLikes(id);
    return { success: true };
  }
}
