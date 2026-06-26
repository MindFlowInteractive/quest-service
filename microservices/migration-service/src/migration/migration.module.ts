import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationController } from './migration.controller';
import { MigrationService } from './migration.service';
import { MigrationEntity } from './entities/migration.entity';
import { VersionEntity } from './entities/version.entity';
import { RollbackEntity } from './entities/rollback.entity';
import { ValidationService } from '../validation/validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MigrationEntity, VersionEntity, RollbackEntity]),
  ],
  controllers: [MigrationController],
  providers: [MigrationService, ValidationService],
  exports: [MigrationService],
})
export class MigrationModule {}
