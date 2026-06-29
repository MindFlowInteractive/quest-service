import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsTemplate } from './entities/sms-template.entity';
import { TemplateEngineService } from './template-engine.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([SmsTemplate])],
  controllers: [TemplatesController],
  providers: [TemplateEngineService, TemplatesService],
  exports: [TemplateEngineService, TemplatesService],
})
export class TemplatesModule {}
