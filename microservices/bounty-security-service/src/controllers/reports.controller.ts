import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';
import {
  SubmitReportDto,
  TransitionReportDto,
  ListReportsFilterDto,
} from '../dto/report.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new vulnerability report' })
  async submit(@Body() dto: SubmitReportDto) {
    return this.reportsService.submit(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List reports with optional filters' })
  async list(@Query() filter: ListReportsFilterDto) {
    return this.reportsService.list(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a report by id' })
  @ApiParam({ name: 'id' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getById(id);
  }

  @Patch(':id/transition')
  @ApiOperation({ summary: 'Transition a report to a new workflow state' })
  @ApiParam({ name: 'id' })
  async transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionReportDto,
  ) {
    return this.reportsService.transition(id, dto);
  }
}
