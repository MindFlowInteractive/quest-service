import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Export } from './entities/export.entity';
import { ExportJob } from './entities/export-job.entity';
import { ExportFormatConfig } from './entities/export-format.entity';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Export, ExportJob, ExportFormatConfig])],
  providers: [ExportService],
  controllers: [ExportController],
  exports: [ExportService],
})
export class ExportModule {}
