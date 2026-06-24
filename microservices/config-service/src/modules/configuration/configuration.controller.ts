import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { CreateConfigDto, UpdateConfigDto } from '../../common';
import { Config } from '../../entities';

@Controller('configurations')
export class ConfigurationController {
  constructor(private configurationService: ConfigurationService) {}

  @Post()
  async create(@Body() createConfigDto: CreateConfigDto): Promise<Config> {
    if (!createConfigDto.key || !createConfigDto.value) {
      throw new BadRequestException('Key and value are required');
    }
    return this.configurationService.createConfig(createConfigDto);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<Config> {
    return this.configurationService.getConfig(id);
  }

  @Get('key/:key')
  async getByKey(@Param('key') key: string): Promise<Config> {
    return this.configurationService.getConfigByKey(key);
  }

  @Get()
  async getAll(
    @Query('environmentId') environmentId?: string,
    @Query('category') category?: string,
    @Query('includeSecrets') includeSecrets?: string,
  ): Promise<Config[]> {
    return this.configurationService.getAllConfigs(
      environmentId,
      category,
      includeSecrets === 'true',
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateConfigDto: UpdateConfigDto,
  ): Promise<Config> {
    return this.configurationService.updateConfig(id, updateConfigDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.configurationService.deleteConfig(id);
  }

  @Get('environment/:environmentId')
  async getByEnvironment(
    @Param('environmentId') environmentId: string,
  ): Promise<Config[]> {
    return this.configurationService.getConfigsByEnvironment(environmentId);
  }

  @Post(':id/increment-version')
  async incrementVersion(@Param('id') id: string): Promise<Config> {
    return this.configurationService.incrementVersion(id);
  }
}
