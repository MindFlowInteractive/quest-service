import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentFile } from '../entities/content-file.entity.js';
import { StorageService } from './storage.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ContentFile])],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
