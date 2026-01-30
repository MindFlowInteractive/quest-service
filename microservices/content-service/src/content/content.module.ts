import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from '../entities/content.entity.js';
import { ContentFile } from '../entities/content-file.entity.js';
import { ContentController } from './content.controller.js';
import { ContentService } from './content.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Content, ContentFile])],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
