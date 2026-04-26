import { Controller, Post, Body } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('ingest')
  async ingestEvent(@Body() eventData: any) {
    return await this.eventsService.ingestEvent(eventData);
  }
}
