import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Config, Environment } from '../../entities';
import { ConfigurationService } from './configuration.service';
import { ConfigurationController } from './configuration.controller';
import { AuditModule } from '../audit/audit.module';
import { EncryptionService, ValidationService } from '../../common';

@Module({
  imports: [TypeOrmModule.forFeature([Config, Environment]), AuditModule],
  controllers: [ConfigurationController],
  providers: [ConfigurationService, EncryptionService, ValidationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
