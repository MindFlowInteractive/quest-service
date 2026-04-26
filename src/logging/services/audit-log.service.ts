import { Injectable, Logger } from '@nestjs/common';

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'quest.start'
  | 'quest.complete'
  | 'tournament.join'
  | 'tournament.start'
  | 'referral.created'
  | 'admin.action';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  actorId: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  occurredAt: Date;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private readonly entries: AuditEntry[] = [];
  private counter = 1;

  log(
    action: AuditAction,
    actorId: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
  ): AuditEntry {
    const entry: AuditEntry = {
      id: `audit-${this.counter++}`,
      action,
      actorId,
      targetId,
      metadata,
      occurredAt: new Date(),
    };
    this.entries.push(entry);
    this.logger.log(`[audit] ${action} | actor=${actorId}${targetId ? ` target=${targetId}` : ''}`);
    return entry;
  }

  findByActor(actorId: string): AuditEntry[] {
    return this.entries.filter((e) => e.actorId === actorId);
  }

  findByAction(action: AuditAction): AuditEntry[] {
    return this.entries.filter((e) => e.action === action);
  }

  findAll(): AuditEntry[] {
    return [...this.entries];
  }
}
