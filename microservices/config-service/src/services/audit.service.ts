import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly repository: Repository<AuditLog>) {}

  record(entry: Partial<AuditLog>): Promise<AuditLog> {
    return this.repository.save(this.repository.create(entry));
  }

  list(service?: string, environment?: string, limit = 100): Promise<AuditLog[]> {
    return this.repository.find({
      where: { ...(service ? { service } : {}), ...(environment ? { environment } : {}) },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 500),
    });
  }
}
