import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto, ListTagsDto } from './dto/tag.dto';
import { Tag } from './entities/tag.entity';

@Controller('tags')
@UseInterceptors(ClassSerializerInterceptor)
export class TagsController {
  private readonly logger = new Logger(TagsController.name);

  constructor(private readonly tagsService: TagsService) {}

  /**
   * POST /tags
   * Create a new tag.
   */
  @Post()
  async create(@Body() dto: CreateTagDto): Promise<Tag> {
    this.logger.log(`Creating tag: ${dto.name}`);
    return this.tagsService.createTag(dto);
  }

  /**
   * GET /tags/trending
   * List trending tags ordered by usageCount DESC.
   */
  @Get('trending')
  async getTrending(@Query('limit') limit?: number): Promise<Tag[]> {
    return this.tagsService.getTrendingTags(limit ? Number(limit) : 10);
  }

  /**
   * GET /tags/recommendations
   * Recommend related tags given seed tags.
   */
  @Get('recommendations')
  async getRecommendations(
    @Query('seeds') seeds?: string,
    @Query('limit') limit?: number,
  ): Promise<Tag[]> {
    const seedArray = seeds ? seeds.split(',').map((s) => s.trim()) : [];
    return this.tagsService.getRecommendedTags(
      seedArray,
      limit ? Number(limit) : 5,
    );
  }

  /**
   * GET /tags
   * List all tags with usageCount, sortable by name or usageCount.
   */
  @Get()
  async findAll(@Query() dto: ListTagsDto): Promise<Tag[]> {
    return this.tagsService.listTags(dto);
  }
}
