import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { EnvironmentService } from './environment.service';
import { CreateEnvironmentDto, UpdateEnvironmentDto } from '../../common';
import { Environment } from '../../entities';

@Controller('environments')
export class EnvironmentController {
  constructor(private environmentService: EnvironmentService) {}

  @Post()
  async create(@Body() createEnvironmentDto: CreateEnvironmentDto): Promise<Environment> {
    return this.environmentService.createEnvironment(createEnvironmentDto);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<Environment> {
    return this.environmentService.getEnvironment(id);
  }

  @Get('name/:name')
  async getByName(@Param('name') name: string): Promise<Environment> {
    return this.environmentService.getEnvironmentByName(name);
  }

  @Get()
  async getAll(): Promise<Environment[]> {
    return this.environmentService.getAllEnvironments();
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEnvironmentDto: UpdateEnvironmentDto,
  ): Promise<Environment> {
    return this.environmentService.updateEnvironment(id, updateEnvironmentDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.environmentService.deleteEnvironment(id);
  }
}
