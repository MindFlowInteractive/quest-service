import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplate } from './entities/email-template.entity';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { TemplateEngineService } from './template-engine.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmailTemplate])],
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplateEngineService],
  exports: [TemplatesService, TemplateEngineService],
})
export class TemplatesModule {}
