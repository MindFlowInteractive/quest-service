import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Environment } from '../entities';
import { CreateEnvironmentDto } from '../dto/config.dto';

@Injectable()
export class EnvironmentService implements OnModuleInit {
  constructor(@InjectRepository(Environment) private readonly repository: Repository<Environment>) {}

  async onModuleInit(): Promise<void> {
    for (const name of ['dev', 'staging', 'prod']) {
      await this.repository.upsert({ name, description: `${name} environment`, active: true }, ['name']);
    }
  }

  create(dto: CreateEnvironmentDto): Promise<Environment> {
    return this.repository.save(this.repository.create({ ...dto, name: dto.name.toLowerCase() }));
  }

  list(): Promise<Environment[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }

  async get(name: string): Promise<Environment> {
    const environment = await this.repository.findOne({ where: { name: name.toLowerCase(), active: true } });
    if (!environment) throw new NotFoundException(`Environment ${name} not found`);
    return environment;
  }
}
