import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Secret } from '../../entities';
import { CreateSecretDto, UpdateSecretDto } from '../../common';
import { EncryptionService } from '../../common/encryption.service';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class SecretService {
  constructor(
    @InjectRepository(Secret)
    private secretRepository: Repository<Secret>,
    private encryptionService: EncryptionService,
    private auditLogService: AuditLogService,
  ) {}

  async createSecret(
    createSecretDto: CreateSecretDto,
    userId?: string,
  ): Promise<Secret> {
    const existingSecret = await this.secretRepository.findOne({
      where: { name: createSecretDto.name },
    });

    if (existingSecret) {
      throw new BadRequestException(
        `Secret with name "${createSecretDto.name}" already exists`,
      );
    }

    const { encryptedText, iv } = this.encryptionService.encrypt(
      createSecretDto.value,
    );

    const secret = this.secretRepository.create({
      name: createSecretDto.name,
      description: createSecretDto.description,
      category: createSecretDto.category,
      encryptedValue: encryptedText,
      iv,
      value: createSecretDto.value,
      rotationIntervalSeconds: createSecretDto.rotationIntervalSeconds || 7776000,
      createdBy: userId,
      updatedBy: userId,
      lastRotatedAt: new Date(),
    });

    const savedSecret = await this.secretRepository.save(secret);

    await this.auditLogService.log(
      'CREATE',
      'Secret',
      savedSecret.id,
      { name: createSecretDto.name },
      userId,
      undefined,
      undefined,
      'WARNING',
    );

    return savedSecret;
  }

  async updateSecret(
    id: string,
    updateSecretDto: UpdateSecretDto,
    userId?: string,
  ): Promise<Secret> {
    const secret = await this.secretRepository.findOne({ where: { id } });

    if (!secret) {
      throw new NotFoundException(`Secret with ID "${id}" not found`);
    }

    if (updateSecretDto.value) {
      const { encryptedText, iv } = this.encryptionService.encrypt(
        updateSecretDto.value,
      );
      secret.encryptedValue = encryptedText;
      secret.iv = iv;
      secret.value = updateSecretDto.value;
      secret.requiresRotation = false;
    }

    if (updateSecretDto.isActive !== undefined) {
      secret.isActive = updateSecretDto.isActive;
    }

    if (updateSecretDto.description !== undefined) {
      secret.description = updateSecretDto.description;
    }

    if (updateSecretDto.rotationIntervalSeconds !== undefined) {
      secret.rotationIntervalSeconds = updateSecretDto.rotationIntervalSeconds;
    }

    secret.updatedBy = userId;

    const updatedSecret = await this.secretRepository.save(secret);

    await this.auditLogService.log(
      'UPDATE',
      'Secret',
      id,
      { name: secret.name },
      userId,
      undefined,
      undefined,
      'WARNING',
    );

    return updatedSecret;
  }

  async getSecret(id: string): Promise<Secret> {
    const secret = await this.secretRepository.findOne({ where: { id } });

    if (!secret) {
      throw new NotFoundException(`Secret with ID "${id}" not found`);
    }

    return secret;
  }

  async getSecretByName(name: string): Promise<Secret> {
    const secret = await this.secretRepository.findOne({
      where: { name, isActive: true },
    });

    if (!secret) {
      throw new NotFoundException(`Secret with name "${name}" not found`);
    }

    return secret;
  }

  async getSecretValue(id: string): Promise<string> {
    const secret = await this.secretRepository.findOne({ where: { id } });

    if (!secret) {
      throw new NotFoundException(`Secret with ID "${id}" not found`);
    }

    if (!secret.encryptedValue || !secret.iv) {
      throw new BadRequestException('Secret value is not encrypted');
    }

    return this.encryptionService.decrypt(secret.encryptedValue, secret.iv);
  }

  async getAllSecrets(): Promise<Secret[]> {
    return this.secretRepository.find({
      order: { name: 'ASC' },
    });
  }

  async deleteSecret(id: string, userId?: string): Promise<void> {
    const secret = await this.secretRepository.findOne({ where: { id } });

    if (!secret) {
      throw new NotFoundException(`Secret with ID "${id}" not found`);
    }

    await this.secretRepository.remove(secret);

    await this.auditLogService.log(
      'DELETE',
      'Secret',
      id,
      { name: secret.name },
      userId,
      undefined,
      undefined,
      'CRITICAL',
    );
  }

  async rotateSecret(
    id: string,
    newValue: string,
    userId?: string,
  ): Promise<Secret> {
    const secret = await this.secretRepository.findOne({ where: { id } });

    if (!secret) {
      throw new NotFoundException(`Secret with ID "${id}" not found`);
    }

    const { encryptedText, iv } = this.encryptionService.encrypt(newValue);

    secret.encryptedValue = encryptedText;
    secret.iv = iv;
    secret.value = newValue;
    secret.lastRotatedAt = new Date();
    secret.rotationCount++;
    secret.requiresRotation = false;
    secret.updatedBy = userId;

    const rotatedSecret = await this.secretRepository.save(secret);

    await this.auditLogService.log(
      'ROTATE',
      'Secret',
      id,
      { name: secret.name },
      userId,
      undefined,
      'Manual rotation',
      'CRITICAL',
    );

    return rotatedSecret;
  }

  async checkSecretsRequiringRotation(): Promise<Secret[]> {
    const now = new Date();
    const secrets = await this.secretRepository.find({
      where: { isActive: true },
    });

    const needsRotation: Secret[] = [];

    for (const secret of secrets) {
      const lastRotated = secret.lastRotatedAt || secret.createdAt;
      const rotationDue = new Date(
        lastRotated.getTime() + secret.rotationIntervalSeconds * 1000,
      );

      if (now > rotationDue) {
        secret.requiresRotation = true;
        await this.secretRepository.save(secret);
        needsRotation.push(secret);
      }
    }

    return needsRotation;
  }

  async getSecretsRequiringRotation(): Promise<Secret[]> {
    return this.secretRepository.find({
      where: { requiresRotation: true, isActive: true },
    });
  }
}
