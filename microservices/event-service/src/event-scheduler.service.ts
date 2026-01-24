import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';

@Injectable()
export class EventSchedulerService {
  private readonly logger = new Logger(EventSchedulerService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  // Runs every minute to check for events to start/stop
  @Cron(CronExpression.EVERY_MINUTE)
  async handleEventScheduling() {
    const now = new Date();
    const events = await this.eventRepository.find();
    for (const event of events) {
      if (event.startTime <= now && event.endTime > now) {
        this.logger.log(`Event started: ${event.name}`);
        // Add logic to mark event as started
      } else if (event.endTime <= now) {
        this.logger.log(`Event ended: ${event.name}`);
        // Add logic to mark event as ended
      }
    }
  }
}
