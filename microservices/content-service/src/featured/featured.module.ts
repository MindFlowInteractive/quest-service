import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeaturedContent } from '../entities/featured-content.entity.js';
import { Content } from '../entities/content.entity.js';
import { ContentModule } from '../content/content.module.js';
import { FeaturedController } from './featured.controller.js';
import { FeaturedService } from './featured.service.js';
import { FeaturedRotationService } from './featured-rotation.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeaturedContent, Content]),
    ContentModule,
  ],
  controllers: [FeaturedController],
  providers: [FeaturedService, FeaturedRotationService],
  exports: [FeaturedService, FeaturedRotationService],
})
export class FeaturedModule {}
