import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
} from '@nestjs/common';
import { ABTestsService } from './ab-tests.service';
import { CreateABTestDto, CompleteABTestDto } from './dto/ab-test.dto';

@Controller('ab-tests')
export class ABTestsController {
  constructor(private readonly abTestsService: ABTestsService) {}

  @Post()
  async create(@Body() dto: CreateABTestDto) {
    return this.abTestsService.create(dto);
  }

  @Get()
  async findAll() {
    return this.abTestsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.abTestsService.findById(id);
  }

  @Put(':id/start')
  async start(@Param('id') id: string) {
    return this.abTestsService.start(id);
  }

  @Post(':id/launch')
  async launch(@Param('id') id: string) {
    return this.abTestsService.launch(id);
  }

  @Put(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteABTestDto,
  ) {
    return this.abTestsService.complete(id, dto);
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.abTestsService.cancel(id);
  }

  @Get(':id/results')
  async getResults(@Param('id') id: string) {
    return this.abTestsService.getResults(id);
  }
}
