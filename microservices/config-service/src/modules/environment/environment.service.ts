import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Environment } from '../../entities';
import { CreateEnvironmentDto, UpdateEnvironmentDto } from '../../common';
import { AuditLogService } from '../audit/audit-log.service';
import { ValidationService } from '../../common/validation.service';

@Injectable()
export class EnvironmentService {
  constructor(
    @InjectRepository(Environment)
    private environmentRepository: Repository<Environment>,
    private auditLogService: AuditLogService,
    private validationService: ValidationService,
  ) {}

  async createEnvironment(
    createEnvironmentDto: CreateEnvironmentDto,
    userId?: string,
  ): Promise<Environment> {
    this.validationService.validateEnvironmentName(createEnvironmentDto.name);

    const existingEnv = await this.environmentRepository.findOne({
      where: { name: createEnvironmentDto.name },
    });

    if (existingEnv) {
      throw new BadRequestException(
        `Environment "${createEnvironmentDto.name}" already exists`,
      );
    }

    const environment = this.environmentRepository.create(createEnvironmentDto);
    const savedEnvironment = await this.environmentRepository.save(environment);

    await this.auditLogService.log(
      'CREATE',
      'Environment',
      savedEnvironment.id,
      createEnvironmentDto,
      userId,
    );

    return savedEnvironment;
  }

  async updateEnvironment(
    id: string,
    updateEnvironmentDto: UpdateEnvironmentDto,
    userId?: string,
  ): Promise<Environment> {
    const environment = await this.environmentRepository.findOne({
      where: { id },
    });

    if (!environment) {
      throw new NotFoundException(`Environment with ID "${id}" not found`);
    }

    Object.assign(environment, updateEnvironmentDto);

    const updatedEnvironment = await this.environmentRepository.save(environment);

    await this.auditLogService.log(
      'UPDATE',
      'Environment',
      id,
      updateEnvironmentDto,
      userId,
    );

    return updatedEnvironment;
  }

  async getEnvironment(id: string): Promise<Environment> {
    const environment = await this.environmentRepository.findOne({
      where: { id },
      relations: ['configs'],
    });

    if (!environment) {
      throw new NotFoundException(`Environment with ID "${id}" not found`);
    }

    return environment;
  }

  async getEnvironmentByName(name: string): Promise<Environment> {
    const environment = await this.environmentRepository.findOne({
      where: { name, isActive: true },
      relations: ['configs'],
    });

    if (!environment) {
      throw new NotFoundException(`Environment "${name}" not found`);
    }

    return environment;
  }

  async getAllEnvironments(): Promise<Environment[]> {
    return this.environmentRepository.find({
      order: { name: 'ASC' },
      relations: ['configs'],
    });
  }

  async deleteEnvironment(id: string, userId?: string): Promise<void> {
    const environment = await this.environmentRepository.findOne({
      where: { id },
    });

    if (!environment) {
      throw new NotFoundException(`Environment with ID "${id}" not found`);
    }

    await this.environmentRepository.remove(environment);

    await this.auditLogService.log(
      'DELETE',
      'Environment',
      id,
      { name: environment.name },
      userId,
    );
  }
}
