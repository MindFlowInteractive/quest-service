import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly svc: CollectionsService) {}

  @Post()
  create(@Body() dto: any) {
    return this.svc.createCollection(dto);
  }

  @Post(':id/assign')
  assignPuzzle(@Param('id') collection_id: string, @Body() body: { puzzle_id: string; order_index?: number }) {
    return this.svc.assignPuzzleToCollection(body.puzzle_id, collection_id, body.order_index || 0);
  }

  @Post('complete')
  userComplete(@Body() body: { user_id: string; puzzle_id: string }) {
    return this.svc.handlePuzzleCompletion(body.user_id, body.puzzle_id);
  }

  @Get('featured')
  featured(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.svc.getFeaturedCollections(Number(page) || 0, Number(limit) || 20);
  }

  @Get('search')
  search(@Query() q: any) {
    return this.svc.searchCollections(q.q, q.category, q.difficulty ? Number(q.difficulty) : undefined, q.reward_type, Number(q.page) || 0, Number(q.limit) || 20);
  }

  @Get(':id')
  get(@Param('id') id: string, @Query('user_id') user_id?: string) {
    return this.svc.getCollectionWithProgress(id, user_id);
  }
}
