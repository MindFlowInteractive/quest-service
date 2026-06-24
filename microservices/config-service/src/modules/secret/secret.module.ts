import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Secret } from '../../entities';
import { SecretService } from './secret.service';
import { SecretController } from './secret.controller';
import { AuditModule } from '../audit/audit.module';
import { EncryptionService } from '../../common';

@Module({
  imports: [TypeOrmModule.forFeature([Secret]), AuditModule],
  controllers: [SecretController],
  providers: [SecretService, EncryptionService],
  exports: [SecretService],
})
export class SecretModule {}
