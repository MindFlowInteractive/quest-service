import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigVersion, Secret } from '../entities';
import { AuditService } from './audit.service';
import { CacheService } from './cache.service';
import { EncryptionService } from './encryption.service';
import { EnvironmentService } from './environment.service';
import { WebhookService } from './webhook.service';

@Injectable()
export class SecretService {
  constructor(
    @InjectRepository(Secret) private readonly repository: Repository<Secret>,
    @InjectRepository(ConfigVersion) private readonly versionRepository: Repository<ConfigVersion>,
    private readonly encryption: EncryptionService,
    private readonly environments: EnvironmentService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
    private readonly webhooks: WebhookService,
  ) {}

  async resolve(service: string, environmentName: string): Promise<Record<string, string>> {
    const cacheKey = `secrets:${service}:${environmentName.toLowerCase()}`;
    const cached = this.cache.get<Record<string, string>>(cacheKey);
    if (cached) return cached;
    const environment = await this.environments.get(environmentName);
    const secrets = await this.repository.createQueryBuilder('secret')
      .addSelect('secret.encryptedValue')
      .leftJoinAndSelect('secret.environment', 'environment')
      .where('secret.service = :service', { service })
      .andWhere('environment.id = :environmentId', { environmentId: environment.id })
      .getMany();
    const values = Object.fromEntries(secrets.map((secret) => [secret.key, this.encryption.decrypt(secret.encryptedValue, secret.keyVersion)]));
    this.cache.set(cacheKey, values);
    return values;
  }

  async upsert(service: string, environmentName: string, key: string, value: string, actor: string): Promise<Omit<Secret, 'encryptedValue'>> {
    const environment = await this.environments.get(environmentName);
    let secret = await this.findWithEncryptedValue(service, environment.id, key);
    if (secret) {
      secret.version += 1;
    } else {
      secret = this.repository.create({ service, environment, key });
    }
    secret.encryptedValue = this.encryption.encrypt(value);
    secret.keyVersion = this.encryption.currentKeyVersion;
    const saved = await this.repository.save(secret);
    await this.saveVersion(saved, actor);
    this.cache.deleteByPrefix(`secrets:${service}:${environment.name}`);
    await this.audit.record({ action: saved.version === 1 ? 'create' : 'update', resourceType: 'secret', resourceId: saved.id, actor, service, environment: environment.name, metadata: { key, version: saved.version, keyVersion: saved.keyVersion } });
    void this.webhooks.publish({ event: 'secret.updated', service, environment: environment.name, key, version: saved.version, occurredAt: new Date().toISOString() });
    return this.redact(saved);
  }

  async rotate(service: string, environmentName: string, key: string | undefined, actor: string): Promise<{ rotated: number; keyVersion: number }> {
    const environment = await this.environments.get(environmentName);
    const query = this.repository.createQueryBuilder('secret').addSelect('secret.encryptedValue')
      .leftJoinAndSelect('secret.environment', 'environment')
      .where('secret.service = :service', { service })
      .andWhere('environment.id = :environmentId', { environmentId: environment.id });
    if (key) query.andWhere('secret.key = :key', { key });
    const secrets = await query.getMany();
    if (key && secrets.length === 0) throw new NotFoundException(`Secret ${key} not found`);
    for (const secret of secrets) {
      const plaintext = this.encryption.decrypt(secret.encryptedValue, secret.keyVersion);
      secret.encryptedValue = this.encryption.encrypt(plaintext);
      secret.keyVersion = this.encryption.currentKeyVersion;
      secret.version += 1;
      secret.rotatedAt = new Date();
      await this.repository.save(secret);
      await this.saveVersion(secret, actor);
      await this.audit.record({ action: 'rotate', resourceType: 'secret', resourceId: secret.id, actor, service, environment: environment.name, metadata: { key: secret.key, version: secret.version, keyVersion: secret.keyVersion } });
      void this.webhooks.publish({ event: 'secret.rotated', service, environment: environment.name, key: secret.key, version: secret.version, occurredAt: new Date().toISOString() });
    }
    this.cache.deleteByPrefix(`secrets:${service}:${environment.name}`);
    return { rotated: secrets.length, keyVersion: this.encryption.currentKeyVersion };
  }

  private findWithEncryptedValue(service: string, environmentId: string, key: string): Promise<Secret | null> {
    return this.repository.createQueryBuilder('secret').addSelect('secret.encryptedValue')
      .leftJoinAndSelect('secret.environment', 'environment')
      .where('secret.service = :service', { service }).andWhere('environment.id = :environmentId', { environmentId }).andWhere('secret.key = :key', { key }).getOne();
  }

  private saveVersion(secret: Secret, actor: string): Promise<ConfigVersion> {
    return this.versionRepository.save(this.versionRepository.create({
      resourceType: 'secret', resourceId: secret.id, version: secret.version,
      snapshot: { encryptedValue: secret.encryptedValue, keyVersion: secret.keyVersion }, changedBy: actor,
    }));
  }

  private redact(secret: Secret): Omit<Secret, 'encryptedValue'> {
    const { encryptedValue: _encryptedValue, ...safe } = secret;
    return safe;
  }
}
