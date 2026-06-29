import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportFormat } from './report.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
  ) {}

  create(data: Partial<Report>): Promise<Report> {
    return this.reportRepo.save(this.reportRepo.create(data));
  }

  findAll(): Promise<Report[]> {
    return this.reportRepo.find();
  }

  findOne(id: string): Promise<Report | null> {
    return this.reportRepo.findOneBy({ id });
  }

  async export(id: string, format: ReportFormat): Promise<{ data: string; format: ReportFormat }> {
    const report = await this.reportRepo.findOneBy({ id });
    if (!report) throw new Error(`Report ${id} not found`);
    // Stub: real implementation would execute report.query and format output
    return { data: JSON.stringify({ reportId: id, query: report.query }), format };
  }
}