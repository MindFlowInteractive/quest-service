import { Controller, Post, Get, Param, Body, NotFoundException } from '@nestjs/common';
import { ExperimentService } from './experiment.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';

@Controller('experiments')
export class ExperimentController {
  constructor(private readonly experimentService: ExperimentService) {}

  @Post()
  async create(@Body() createDto: CreateExperimentDto) {
    return this.experimentService.create(createDto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.experimentService.findOne(id);
  }

  @Post(':id/variants')
  async addVariant(
    @Param('id') experimentId: string,
    @Body('name') name: string,
    @Body('weight') weight?: number,
  ) {
    return this.experimentService.addVariant(experimentId, name, weight);
  }

  @Post(':id/results')
  async recordResult(
    @Param('id') experimentId: string,
    @Body('variantId') variantId: string,
    @Body('userId') userId: string,
    @Body('metric') metric?: number,
  ) {
    return this.experimentService.recordResult(experimentId, variantId, userId, metric);
  }
}
