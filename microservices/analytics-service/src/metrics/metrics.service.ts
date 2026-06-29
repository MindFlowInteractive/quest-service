import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metric } from './metric.entity';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,
  ) {}

  async aggregateMetric(name: string, value: number, dimensions?: any) {
    let metric = await this.metricRepository.findOne({ where: { name, dimensions } });

    if (metric) {
      metric.value += value;
    } else {
      metric = this.metricRepository.create({ name, value, dimensions });
    }

    return await this.metricRepository.save(metric);
  }

  async getMetrics() {
    return await this.metricRepository.find();
  }
}
