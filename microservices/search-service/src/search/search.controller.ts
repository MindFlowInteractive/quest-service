import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { SearchService } from './search.service';
import { CreateIndexDto } from '../dto/create-index.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('index')
  async index(@Body() dto: CreateIndexDto) {
    return this.searchService.indexDocument(dto);
  }

  @Get()
  async search(@Query('type') type: string, @Query('q') q: string, @Query('filters') filters?: string) {
    const query = {
      query: {
        bool: {
          must: [{
            multi_match: {
              query: q,
              fields: ['*'],
            },
          }],
          filter: filters ? JSON.parse(filters) : [],
        },
      },
    };
    const index = type === 'puzzle' ? 'puzzles' : 'players';
    return this.searchService.search(index, query);
  }

  @Get('suggest')
  async suggest(@Query('type') type: string, @Query('text') text: string) {
    const suggester = {
      suggestion: {
        text,
        term: {
          field: 'suggest',
        },
      },
    };
    const index = type === 'puzzle' ? 'puzzles' : 'players';
    return this.searchService.suggest(index, suggester);
  }

  @Post('analytics')
  async analytics(@Body() event: any) {
    return this.searchService.trackAnalytics(event);
  }
}
