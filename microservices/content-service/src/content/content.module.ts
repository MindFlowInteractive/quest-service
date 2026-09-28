import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from '../entities/content.entity.js';
import { ContentFile } from '../entities/content-file.entity.js';
import { ContentRevision } from '../entities/content-revision.entity.js';
import { ContentDeliveryEvent } from '../entities/content-delivery-event.entity.js';
import { ContentController } from './content.controller.js';
import { ContentDeliveryController } from './content-delivery.controller.js';
import { ContentFilesController } from './content-files.controller.js';
import { ContentService } from './content.service.js';
import { ContentDeliveryService } from './content-delivery.service.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Content, ContentFile, ContentRevision, ContentDeliveryEvent]), StorageModule],
  controllers: [ContentController, ContentDeliveryController, ContentFilesController],
  providers: [ContentService, ContentDeliveryService],
  exports: [ContentService],
})
export class ContentModule {}
