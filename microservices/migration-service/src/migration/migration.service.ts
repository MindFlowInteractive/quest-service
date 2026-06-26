import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MigrationEntity, MigrationStatus } from './entities/migration.entity';
import { VersionEntity } from './entities/version.entity';
import { RollbackEntity } from './entities/rollback.entity';
import { ValidationService } from '../validation/validation.service';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectRepository(MigrationEntity)
    private readonly migrationRepository: Repository<MigrationEntity>,
    @InjectRepository(VersionEntity)
    private readonly versionRepository: Repository<VersionEntity>,
    @InjectRepository(RollbackEntity)
    private readonly rollbackRepository: Repository<RollbackEntity>,
    private readonly validationService: ValidationService,
  ) {}

  async applyMigration(targetDatabase: string, migrationName: string, sqlScript: string, versionInc: number = 1): Promise<MigrationEntity> {
    this.logger.log(`Starting migration ${migrationName} for database ${targetDatabase}`);

    const migration = this.migrationRepository.create({
      name: migrationName,
      targetDatabase,
      status: MigrationStatus.PENDING,
    });
    await this.migrationRepository.save(migration);

    // Normally we'd resolve a dynamic data source here based on targetDatabase
    // Assuming `dataSource` is the primary connection for demo or we'd maintain a pool
    const dataSource = this.migrationRepository.manager.connection; // using local connection for simplicity

    try {
      const isValidPre = await this.validationService.validatePreMigration(dataSource, targetDatabase);
      if (!isValidPre) {
        throw new Error('Pre-migration validation failed');
      }

      // Execute actual migration
      // Note: for a zero-downtime strategy, the script should be backward compatible
      await dataSource.query(sqlScript);

      const isValidPost = await this.validationService.validatePostMigration(dataSource, targetDatabase);
      if (!isValidPost) {
        throw new Error('Post-migration validation failed');
      }

      // Update Version
      let versionRecord = await this.versionRepository.findOne({ where: { targetDatabase } });
      if (!versionRecord) {
        versionRecord = this.versionRepository.create({ targetDatabase, version: 0 });
      }
      versionRecord.version += versionInc;
      await this.versionRepository.save(versionRecord);

      migration.status = MigrationStatus.SUCCESS;
      migration.completedAt = new Date();
      await this.migrationRepository.save(migration);

      this.logger.log(`Successfully applied migration ${migrationName}`);
      return migration;
    } catch (error) {
      this.logger.error(`Failed to apply migration ${migrationName}`, error);
      migration.status = MigrationStatus.FAILED;
      migration.error = error.message;
      migration.completedAt = new Date();
      await this.migrationRepository.save(migration);
      throw error;
    }
  }

  async rollbackMigration(migrationId: string, rollbackScript: string, reason: string, executor: string): Promise<RollbackEntity> {
    this.logger.log(`Rolling back migration ${migrationId}`);

    const migration = await this.migrationRepository.findOne({ where: { id: migrationId } });
    if (!migration) {
      throw new Error(`Migration with ID ${migrationId} not found`);
    }

    if (migration.status !== MigrationStatus.SUCCESS && migration.status !== MigrationStatus.FAILED) {
      throw new Error('Can only rollback completed or failed migrations');
    }

    const dataSource = this.migrationRepository.manager.connection;

    try {
      await dataSource.query(rollbackScript);

      const rollback = this.rollbackRepository.create({
        migrationId,
        targetDatabase: migration.targetDatabase,
        reason,
        executor,
      });
      await this.rollbackRepository.save(rollback);

      migration.status = MigrationStatus.ROLLED_BACK;
      await this.migrationRepository.save(migration);

      // Decrement version (simplistic approach)
      const versionRecord = await this.versionRepository.findOne({ where: { targetDatabase: migration.targetDatabase } });
      if (versionRecord && versionRecord.version > 0) {
        versionRecord.version -= 1;
        await this.versionRepository.save(versionRecord);
      }

      this.logger.log(`Successfully rolled back migration ${migrationId}`);
      return rollback;
    } catch (error) {
      this.logger.error(`Failed to rollback migration ${migrationId}`, error);
      throw error;
    }
  }

  async getMigrationStatus(targetDatabase: string): Promise<{ version: number; latestMigrations: MigrationEntity[] }> {
    const versionRecord = await this.versionRepository.findOne({ where: { targetDatabase } });
    const latestMigrations = await this.migrationRepository.find({
      where: { targetDatabase },
      order: { startedAt: 'DESC' },
      take: 5,
    });

    return {
      version: versionRecord ? versionRecord.version : 0,
      latestMigrations,
    };
  }
}
