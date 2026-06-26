import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { MigrationService } from './migration.service';

export class ApplyMigrationDto {
  targetDatabase: string;
  migrationName: string;
  sqlScript: string;
}

export class RollbackMigrationDto {
  rollbackScript: string;
  reason: string;
  executor: string;
}

@Controller('migrations')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Post('apply')
  async applyMigration(@Body() dto: ApplyMigrationDto) {
    if (!dto.targetDatabase || !dto.migrationName || !dto.sqlScript) {
      throw new BadRequestException('targetDatabase, migrationName, and sqlScript are required');
    }
    return this.migrationService.applyMigration(dto.targetDatabase, dto.migrationName, dto.sqlScript);
  }

  @Post('rollback/:id')
  async rollbackMigration(@Param('id') id: string, @Body() dto: RollbackMigrationDto) {
    if (!dto.rollbackScript || !dto.reason || !dto.executor) {
      throw new BadRequestException('rollbackScript, reason, and executor are required');
    }
    return this.migrationService.rollbackMigration(id, dto.rollbackScript, dto.reason, dto.executor);
  }

  @Get('status/:database')
  async getStatus(@Param('database') database: string) {
    return this.migrationService.getMigrationStatus(database);
  }
}
