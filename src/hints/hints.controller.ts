import { Body, Controller, Get, Post, Query, Patch } from '@nestjs/common';
import { HintsService } from './hints.service';
import { CreateHintDto, RequestHintDto, HintUsageDto } from './dto/create-hint.dto';

@Controller('hints')
export class HintsController {
  constructor(private readonly hintsService: HintsService) {}

  @Post('create')
  async create(@Body() dto: CreateHintDto) {
    return this.hintsService.createHint(dto);
  }

  @Post('request')
  async request(@Body() dto: RequestHintDto) {
    return this.hintsService.requestHint(dto);
  }

  @Post('usage')
  async recordUsage(@Body() dto: HintUsageDto) {
    return this.hintsService.recordUsage(dto);
  }

  @Get('templates')
  async listTemplates(
    @Query('puzzleType') puzzleType?: string,
    @Query('difficulty') difficulty?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.hintsService.listTemplates({
      puzzleType,
      difficulty,
      activeOnly: activeOnly ? activeOnly === 'true' : undefined,
    });
  }

  @Patch('templates')
  async updateTemplate(
    @Query('id') id: string,
    @Body() body: any,
  ) {
    return this.hintsService.updateTemplate(id, body);
  }

  @Post('templates/toggle')
  async toggleTemplate(
    @Query('id') id: string,
    @Query('active') active: string,
  ) {
    return this.hintsService.toggleTemplate(id, active === 'true');
  }

  @Post('templates/seed')
  async seedTemplates() {
    return this.hintsService.seedDefaultTemplates();
  }
}


