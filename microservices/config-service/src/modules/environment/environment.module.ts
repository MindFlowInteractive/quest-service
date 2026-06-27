import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Environment } from '../../entities';
import { EnvironmentService } from './environment.service';
import { EnvironmentController } from './environment.controller';
import { AuditModule } from '../audit/audit.module';
import { ValidationService } from '../../common';

@Module({
  imports: [TypeOrmModule.forFeature([Environment]), AuditModule],
  controllers: [EnvironmentController],
  providers: [EnvironmentService, ValidationService],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}
