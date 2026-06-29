import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SeasonalEventService } from './seasonal-event.service';

@Controller('seasonal-events')
export class SeasonalEventController {
  constructor(private readonly svc: SeasonalEventService) {}

  @Post()
  create(
    @Body('name') name: string, @Body('season') season: string,
    @Body('startDate') start: string, @Body('endDate') end: string,
  ) {
    return this.svc.create(name, season, start, end);
  }

  @Get()
  findAll() { return this.svc.findAll(); }

  @Get('active')
  findActive() { return this.svc.findActive(); }

  @Post(':id/activate')
  activate(@Param('id') id: string) { return this.svc.activate(id); }
}
