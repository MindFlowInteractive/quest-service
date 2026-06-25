import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MigrationRecord, MigrationStatus } from '../entities/migration-record.entity';

@Injectable()
export class MigrationRunnerService {
  private readonly logger = new Logger(MigrationRunnerService.name);

  constructor(
    @InjectRepository(MigrationRecord) private readonly recordRepo: Repository<MigrationRecord>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Executes a database schema modification safely using transactional isolations
   */
  async runSafeMigration(version: string, forwardSql: string, rollbackSql: string): Promise<MigrationRecord> {
    let record = await this.recordRepo.findOneBy({ version });

    if (!record) {
      record = this.recordRepo.create({ version, name: `Migration_${version}`, status: MigrationStatus.PENDING, rollbackScript: rollbackSql });
      await this.recordRepo.save(record);
    }

    if (record.status === MigrationStatus.COMPLETED) {
      throw new BadRequestException(`Migration version ${version} has already been applied.`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    record.status = MigrationStatus.RUNNING;
    await this.recordRepo.save(record);

    const startTime = Date.now();
    try {
      // Execute the structural update forward statement
      await queryRunner.query(forwardSql);

      await queryRunner.commitTransaction();

      record.status = MigrationStatus.COMPLETED;
      record.executionTimeMs = Date.now() - startTime;
      record.executionLog = 'Migration executed successfully without data exceptions.';
    } catch (error) {
      this.logger.error(`Migration ${version} failed. Rollback triggered automatically. Error: ${error.message}`);
      await queryRunner.rollbackTransaction();

      record.status = MigrationStatus.FAILED;
      record.executionLog = `Failure Reason: ${error.message}`;
    } finally {
      await queryRunner.release();
      await this.recordRepo.save(record);
    }

    return record;
  }

  /**
   * Safely reverts schema configurations to a specific target checkpoint
   */
  async revertMigration(version: string): Promise<MigrationRecord> {
    const record = await this.recordRepo.findOneBy({ version, status: MigrationStatus.COMPLETED });
    if (!record) {
      throw new BadRequestException(`No completed migration found matching version tag: ${version}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (record.rollbackScript) {
        await queryRunner.query(record.rollbackScript);
      }
      await queryRunner.commitTransaction();

      record.status = MigrationStatus.ROLLED_BACK;
      record.executionLog = `Reverted smoothly on request checkpoint initialization loop.`;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Critical rollback failure: ${error.message}`);
    } finally {
      await queryRunner.release();
      await this.recordRepo.save(record);
    }

    return record;
  }
}