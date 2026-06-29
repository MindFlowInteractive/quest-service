import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PuzzleLibraryService, Difficulty } from './puzzle-library.service';

@Controller('puzzles')
export class PuzzleLibraryController {
  constructor(private readonly svc: PuzzleLibraryService) {}

  @Post()
  create(@Body('title') t: string, @Body('category') c: string, @Body('difficulty') d: Difficulty) {
    return this.svc.create(t, c, d);
  }

  @Get()
  findAll(@Query('category') cat?: string) { return this.svc.findAll(cat); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findById(id); }

  @Post(':id/tags')
  addTag(@Param('id') id: string, @Body('tag') tag: string) { return this.svc.addTag(id, tag); }
}
