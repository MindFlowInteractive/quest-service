import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createCipheriv, randomBytes } from 'crypto';
import { Export, ExportFormat, ExportStatus } from './entities/export.entity';
import { ExportJob, JobStatus } from './entities/export-job.entity';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectRepository(Export)
    private readonly exportRepo: Repository<Export>,
    @InjectRepository(ExportJob)
    private readonly jobRepo: Repository<ExportJob>,
  ) {}

  async createExport(playerId: string, format: ExportFormat): Promise<Export> {
    const exp = this.exportRepo.create({ playerId, format });
    const saved = await this.exportRepo.save(exp);
    await this.jobRepo.save(this.jobRepo.create({ exportId: saved.id }));
    return saved;
  }

  async aggregatePlayerData(playerId: string): Promise<Record<string, unknown>> {
    // Aggregates all player data â€” extend with real DB queries per domain
    return {
      playerId,
      exportedAt: new Date().toISOString(),
      profile: {},
      quests: [],
      achievements: [],
      inventory: [],
      transactions: [],
    };
  }

  toJson(data: Record<string, unknown>): string {
    return JSON.stringify(data, null, 2);
  }

  toCsv(data: Record<string, unknown>): string {
    const flat = this.flatten(data);
    const headers = Object.keys(flat).join(',');
    const values = Object.values(flat)
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
    return `${headers}\n${values}`;
  }

  toPdf(data: Record<string, unknown>): string {
    // Returns a minimal text-based PDF representation
    const lines = Object.entries(this.flatten(data))
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    return `%PDF-1.4\n% Player Data Export\n${lines}`;
  }

  encrypt(plaintext: string): { encrypted: string; iv: string; key: string } {
    const key = randomBytes(32);
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('hex'),
      key: key.toString('hex'),
    };
  }

  async markCompleted(exportId: string, filePath: string): Promise<void> {
    await this.exportRepo.update(exportId, { status: ExportStatus.COMPLETED, filePath });
    await this.jobRepo.update(
      { exportId },
      { status: JobStatus.DONE, completedAt: new Date() },
    );
  }

  async markFailed(exportId: string, error: string): Promise<void> {
    await this.exportRepo.update(exportId, { status: ExportStatus.FAILED, errorMessage: error });
    await this.jobRepo.update({ exportId }, { status: JobStatus.FAILED, errorMessage: error });
  }

  private flatten(
    obj: Record<string, unknown>,
    prefix = '',
  ): Record<string, string> {
    return Object.entries(obj).reduce<Record<string, string>>((acc, [k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(acc, this.flatten(v as Record<string, unknown>, key));
      } else {
        acc[key] = Array.isArray(v) ? JSON.stringify(v) : String(v ?? '');
      }
      return acc;
    }, {});
  }
}
