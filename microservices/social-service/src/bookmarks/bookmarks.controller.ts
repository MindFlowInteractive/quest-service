import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto, UpdateBookmarkDto } from './dto';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  create(@Body() createBookmarkDto: CreateBookmarkDto) {
    const userId = '';
    return this.bookmarksService.create(userId, createBookmarkDto);
  }

  @Get()
  findAll() {
    const userId = '';
    return this.bookmarksService.findAll(userId);
  }

  @Get('search')
  search(@Query('q') query: string) {
    const userId = '';
    return this.bookmarksService.search(userId, query);
  }

  @Get('puzzle/:puzzleId')
  findByPuzzle(@Param('puzzleId') puzzleId: string) {
    const userId = '';
    return this.bookmarksService.findByPuzzle(userId, puzzleId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookmarksService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateBookmarkDto: UpdateBookmarkDto,
  ) {
    return this.bookmarksService.update(id, updateBookmarkDto);
  }

  @Put(':id/toggle-favorite')
  toggleFavorite(@Param('id') id: string) {
    return this.bookmarksService.toggleFavorite(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookmarksService.remove(id);
  }
}
