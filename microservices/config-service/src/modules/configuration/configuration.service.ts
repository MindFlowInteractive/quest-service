import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Config, Environment } from '../../entities';
import { CreateConfigDto, UpdateConfigDto } from '../../common';
import { AuditLogService } from '../audit/audit-log.service';
import { ValidationService } from '../../common/validation.service';

@Injectable()
export class ConfigurationService {
  private readonly CACHE_PREFIX = 'config:';

  constructor(
    @InjectRepository(Config)
    private configRepository: Repository<Config>,
    @InjectRepository(Environment)
    private environmentRepository: Repository<Environment>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private auditLogService: AuditLogService,
    private validationService: ValidationService,
  ) {}

  async createConfig(
    createConfigDto: CreateConfigDto,
    userId?: string,
  ): Promise<Config> {
    this.validationService.validateConfigKey(createConfigDto.key);
    this.validationService.validateConfigType(
      createConfigDto.type || 'string',
      createConfigDto.value,
    );

    const existingConfig = await this.configRepository.findOne({
      where: { key: createConfigDto.key },
    });

    if (existingConfig) {
      throw new BadRequestException(
        `Configuration with key "${createConfigDto.key}" already exists`,
      );
    }

    const config = this.configRepository.create({
      ...createConfigDto,
      type: createConfigDto.type || 'string',
      createdBy: userId,
      updatedBy: userId,
      version: '1.0.0',
    });

    const savedConfig = await this.configRepository.save(config);

    await this.auditLogService.log(
      'CREATE',
      'Config',
      savedConfig.id,
      createConfigDto,
      userId,
    );

    await this.invalidateCache(savedConfig.key);

    return savedConfig;
  }

  async updateConfig(
    id: string,
    updateConfigDto: UpdateConfigDto,
    userId?: string,
  ): Promise<Config> {
    const config = await this.configRepository.findOne({ where: { id } });

    if (!config) {
      throw new NotFoundException(`Configuration with ID "${id}" not found`);
    }

    if (updateConfigDto.value) {
      this.validationService.validateConfigType(config.type, updateConfigDto.value);
    }

    const oldValue = config.value;

    Object.assign(config, {
      ...updateConfigDto,
      updatedBy: userId,
    });

    const updatedConfig = await this.configRepository.save(config);

    await this.auditLogService.log(
      'UPDATE',
      'Config',
      id,
      { oldValue, newValue: updateConfigDto.value },
      userId,
    );

    await this.invalidateCache(config.key);

    return updatedConfig;
  }

  async getConfig(id: string): Promise<Config> {
    const config = await this.configRepository.findOne({ where: { id } });

    if (!config) {
      throw new NotFoundException(`Configuration with ID "${id}" not found`);
    }

    return config;
  }

  async getConfigByKey(key: string): Promise<Config> {
    const cacheKey = this.CACHE_PREFIX + key;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) {
      return cached as Config;
    }

    const config = await this.configRepository.findOne({
      where: { key, isActive: true },
    });

    if (!config) {
      throw new NotFoundException(`Configuration with key "${key}" not found`);
    }

    const ttl = parseInt(process.env.CACHE_TTL || '3600', 10) * 1000;
    await this.cacheManager.set(cacheKey, config, ttl);

    return config;
  }

  async getAllConfigs(
    environmentId?: string,
    category?: string,
    includeSecrets = false,
  ): Promise<Config[]> {
    let query = this.configRepository.createQueryBuilder('config');

    if (!includeSecrets) {
      query = query.where('config.isSecret = :isSecret', { isSecret: false });
    }

    if (environmentId) {
      query = query.andWhere('config.environmentId = :environmentId', {
        environmentId,
      });
    }

    if (category) {
      query = query.andWhere('config.category = :category', { category });
    }

    return query.orderBy('config.key', 'ASC').getMany();
  }

  async deleteConfig(id: string, userId?: string): Promise<void> {
    const config = await this.configRepository.findOne({ where: { id } });

    if (!config) {
      throw new NotFoundException(`Configuration with ID "${id}" not found`);
    }

    await this.configRepository.remove(config);

    await this.auditLogService.log(
      'DELETE',
      'Config',
      id,
      { key: config.key, value: config.value },
      userId,
    );

    await this.invalidateCache(config.key);
  }

  async invalidateCache(key: string): Promise<void> {
    const cacheKey = this.CACHE_PREFIX + key;
    await this.cacheManager.del(cacheKey);
  }

  async invalidateAllCache(): Promise<void> {
    await this.cacheManager.reset();
  }

  async getConfigsByEnvironment(environmentId: string): Promise<Config[]> {
    const environment = await this.environmentRepository.findOne({
      where: { id: environmentId },
    });

    if (!environment) {
      throw new NotFoundException(
        `Environment with ID "${environmentId}" not found`,
      );
    }

    return this.configRepository.find({
      where: { environmentId, isActive: true },
      order: { key: 'ASC' },
    });
  }

  async getCacheStats(): Promise<{
    size: number;
    estimatedItems: number;
  }> {
    return {
      size: 0,
      estimatedItems: 0,
    };
  }

  async incrementVersion(id: string): Promise<Config> {
    const config = await this.configRepository.findOne({ where: { id } });

    if (!config) {
      throw new NotFoundException(`Configuration with ID "${id}" not found`);
    }

    const versionParts = (config.version || '1.0.0').split('.').map(Number);
    versionParts[2]++;

    config.version = versionParts.join('.');

    return this.configRepository.save(config);
  }
}
