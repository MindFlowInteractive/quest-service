import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from '../entities/content.entity.js';
import { ContentFile } from '../entities/content-file.entity.js';
import { ContentController } from './content.controller.js';
import { ContentFilesController } from './content-files.controller.js';
import { ContentService } from './content.service.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Content, ContentFile]), StorageModule],
  controllers: [ContentController, ContentFilesController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
