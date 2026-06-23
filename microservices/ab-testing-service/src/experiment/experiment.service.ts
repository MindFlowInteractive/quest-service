import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experiment } from '../../entities/experiment.entity';
import { Variant } from '../../entities/variant.entity';
import { Result } from '../../entities/result.entity';
import { CreateExperimentDto } from './dto/create-experiment.dto';

@Injectable()
export class ExperimentService {
  constructor(
    @InjectRepository(Experiment)
    private readonly experimentRepo: Repository<Experiment>,
    @InjectRepository(Variant)
    private readonly variantRepo: Repository<Variant>,
    @InjectRepository(Result)
    private readonly resultRepo: Repository<Result>,
  ) {}

  async create(dto: CreateExperimentDto): Promise<Experiment> {
    const experiment = this.experimentRepo.create(dto);
    return this.experimentRepo.save(experiment);
  }

  async findOne(id: string): Promise<Experiment> {
    const exp = await this.experimentRepo.findOne({ where: { id } });
    if (!exp) throw new NotFoundException('Experiment not found');
    return exp;
  }

  async addVariant(experimentId: string, name: string, weight: number = 1): Promise<Variant> {
    const experiment = await this.findOne(experimentId);
    const variant = this.variantRepo.create({ experimentId: experiment.id, name, weight });
    return this.variantRepo.save(variant);
  }

  async recordResult(experimentId: string, variantId: string, userId: string, metric?: number): Promise<Result> {
    // simple validation
    await this.findOne(experimentId);
    const variant = await this.variantRepo.findOne({ where: { id: variantId, experimentId } });
    if (!variant) throw new NotFoundException('Variant not found');
    const result = this.resultRepo.create({ experimentId, variantId, userId, metric });
    return this.resultRepo.save(result);
  }

  // Additional methods for analysis can be added later
}
