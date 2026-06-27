import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { SecretService } from './secret.service';
import { CreateSecretDto, UpdateSecretDto } from '../../common';
import { Secret } from '../../entities';

@Controller('secrets')
export class SecretController {
  constructor(private secretService: SecretService) {}

  @Post()
  async create(@Body() createSecretDto: CreateSecretDto): Promise<Secret> {
    if (!createSecretDto.name || !createSecretDto.value) {
      throw new BadRequestException('Name and value are required');
    }
    return this.secretService.createSecret(createSecretDto);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<Secret> {
    return this.secretService.getSecret(id);
  }

  @Get(':id/value')
  async getSecretValue(@Param('id') id: string): Promise<{ value: string }> {
    const value = await this.secretService.getSecretValue(id);
    return { value };
  }

  @Get('name/:name')
  async getByName(@Param('name') name: string): Promise<Secret> {
    return this.secretService.getSecretByName(name);
  }

  @Get()
  async getAll(): Promise<Secret[]> {
    return this.secretService.getAllSecrets();
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSecretDto: UpdateSecretDto): Promise<Secret> {
    return this.secretService.updateSecret(id, updateSecretDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.secretService.deleteSecret(id);
  }

  @Post(':id/rotate')
  async rotate(
    @Param('id') id: string,
    @Body() { newValue }: { newValue: string },
  ): Promise<Secret> {
    if (!newValue) {
      throw new BadRequestException('New value is required');
    }
    return this.secretService.rotateSecret(id, newValue);
  }

  @Get('rotation/check')
  async checkRotation(): Promise<Secret[]> {
    return this.secretService.checkSecretsRequiringRotation();
  }

  @Get('rotation/pending')
  async getPendingRotation(): Promise<Secret[]> {
    return this.secretService.getSecretsRequiringRotation();
  }
}
