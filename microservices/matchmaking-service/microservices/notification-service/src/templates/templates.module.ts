import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationTemplate } from './entities/template.entity';
import { TemplateEngineService } from './template-engine.service';

@Module({
    imports: [TypeOrmModule.forFeature([NotificationTemplate])],
    providers: [TemplateEngineService],
    exports: [TemplateEngineService, TypeOrmModule],
})
export class TemplatesModule { }
