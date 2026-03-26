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
   * Create a new tag (admin/editor only — guard can be added when auth is wired up).
   */
  @Post()
  async create(@Body() dto: CreateTagDto): Promise<Tag> {
    this.logger.log(`Creating tag: ${dto.name}`);
    return this.tagsService.createTag(dto);
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
