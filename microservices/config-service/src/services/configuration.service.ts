import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpsertConfigDto } from '../dto/config.dto';
import { ConfigEntry, ConfigKind, ConfigVersion } from '../entities';
import { AuditService } from './audit.service';
import { CacheService } from './cache.service';
import { EnvironmentService } from './environment.service';
import { WebhookService } from './webhook.service';

export interface ResolvedConfiguration {
  service: string;
  environment: string;
  values: Record<string, unknown>;
  featureFlags: Record<string, unknown>;
  versions: Record<string, number>;
  fetchedAt: string;
}

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectRepository(ConfigEntry) private readonly repository: Repository<ConfigEntry>,
    @InjectRepository(ConfigVersion) private readonly versionRepository: Repository<ConfigVersion>,
    private readonly environments: EnvironmentService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
    private readonly webhooks: WebhookService,
  ) {}

  async resolve(service: string, environmentName: string): Promise<ResolvedConfiguration> {
    const cacheKey = this.cacheKey(service, environmentName);
    const cached = this.cache.get<ResolvedConfiguration>(cacheKey);
    if (cached) return cached;
    const environment = await this.environments.get(environmentName);
    const entries = await this.repository.find({ where: { service, environment: { id: environment.id } }, order: { key: 'ASC' } });
    const result: ResolvedConfiguration = {
      service,
      environment: environment.name,
      values: {},
      featureFlags: {},
      versions: {},
      fetchedAt: new Date().toISOString(),
    };
    for (const entry of entries) {
      const target = entry.kind === ConfigKind.FEATURE_FLAG ? result.featureFlags : result.values;
      target[entry.key] = entry.value;
      result.versions[entry.key] = entry.version;
    }
    this.cache.set(cacheKey, result);
    return result;
  }

  async upsert(service: string, environmentName: string, key: string, dto: UpsertConfigDto, actor: string): Promise<ConfigEntry> {
    const environment = await this.environments.get(environmentName);
    let entry = await this.repository.findOne({ where: { service, environment: { id: environment.id }, key } });
    if (entry) {
      entry.value = dto.value;
      entry.kind = dto.kind ?? entry.kind;
      entry.description = dto.description ?? entry.description;
      entry.version += 1;
    } else {
      entry = this.repository.create({ service, environment, key, value: dto.value, kind: dto.kind ?? ConfigKind.SETTING, description: dto.description });
    }
    const saved = await this.repository.save(entry);
    await this.versionRepository.save(this.versionRepository.create({
      resourceType: 'config', resourceId: saved.id, version: saved.version,
      snapshot: { value: saved.value, kind: saved.kind, description: saved.description }, changedBy: actor,
    }));
    this.invalidate(service, environment.name);
    await this.audit.record({ action: entry.version === 1 ? 'create' : 'update', resourceType: 'config', resourceId: saved.id, actor, service, environment: environment.name, metadata: { key, version: saved.version } });
    void this.webhooks.publish({ event: 'config.updated', service, environment: environment.name, key, version: saved.version, occurredAt: new Date().toISOString() });
    return saved;
  }

  async remove(service: string, environmentName: string, key: string, actor: string): Promise<void> {
    const environment = await this.environments.get(environmentName);
    const entry = await this.repository.findOne({ where: { service, environment: { id: environment.id }, key } });
    if (!entry) throw new NotFoundException(`Configuration ${key} not found`);
    await this.repository.remove(entry);
    this.invalidate(service, environment.name);
    await this.audit.record({ action: 'delete', resourceType: 'config', resourceId: entry.id, actor, service, environment: environment.name, metadata: { key, version: entry.version } });
    void this.webhooks.publish({ event: 'config.deleted', service, environment: environment.name, key, version: entry.version, occurredAt: new Date().toISOString() });
  }

  listVersions(resourceId: string): Promise<ConfigVersion[]> {
    return this.versionRepository.find({ where: { resourceId }, order: { version: 'DESC' } });
  }

  async rollback(resourceId: string, version: number, actor: string): Promise<ConfigEntry> {
    const entry = await this.repository.findOne({ where: { id: resourceId } });
    if (!entry) throw new NotFoundException('Configuration not found');
    const historical = await this.versionRepository.findOne({ where: { resourceId, version } });
    if (!historical) throw new NotFoundException(`Version ${version} not found`);
    const snapshot = historical.snapshot;
    return this.upsert(entry.service, entry.environment.name, entry.key, {
      value: snapshot.value,
      kind: snapshot.kind as ConfigKind,
      description: snapshot.description as string | undefined,
    }, actor);
  }

  private invalidate(service: string, environment: string): void {
    this.cache.deleteByPrefix(this.cacheKey(service, environment));
  }

  private cacheKey(service: string, environment: string): string {
    return `config:${service}:${environment.toLowerCase()}`;
  }
}
