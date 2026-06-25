import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { MigrationRunnerService } from './migration-runner.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MigrationRecord } from '../entities/migration-record.entity';

@Controller('migrations')
export class MigrationController {
  constructor(
    private readonly runnerService: MigrationRunnerService,
    @InjectRepository(MigrationRecord) private readonly recordRepo: Repository<MigrationRecord>,
  ) {}

  @Get('status')
  async getStatusSummary() {
    return this.recordRepo.find({ order: { version: 'DESC' } });
  }

  @Post('apply')
  async applySchemaChange(@Body() body: { version: string; forwardSql: string; rollbackSql: string }) {
    return this.runnerService.runSafeMigration(body.version, body.forwardSql, body.rollbackSql);
  }

  @Put('revert/:version')
  async triggerRollback(@Param('version') version: string) {
    return this.runnerService.revertMigration(version);
  }
}