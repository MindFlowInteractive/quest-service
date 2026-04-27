import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Event } from './event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectQueue('event-processing')
    private readonly eventQueue: Queue,
  ) {}

  async ingestEvent(eventData: any) {
    const event = this.eventRepository.create({
      type: eventData.type,
      playerId: eventData.playerId,
      data: eventData.data,
      timestamp: eventData.timestamp || new Date(),
    });

    const savedEvent = await this.eventRepository.save(event);

    // Add to queue for asynchronous processing (metrics aggregation)
    await this.eventQueue.add('process-event', savedEvent);

    return savedEvent;
  }
}
