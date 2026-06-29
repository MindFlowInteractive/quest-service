import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportFormat } from './entities/export.entity';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  create(@Body() body: { playerId: string; format: ExportFormat }) {
    return this.exportService.createExport(body.playerId, body.format);
  }

  @Get(':playerId/data')
  getData(@Param('playerId') playerId: string) {
    return this.exportService.aggregatePlayerData(playerId);
  }
}
