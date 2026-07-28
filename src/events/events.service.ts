import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeadLetterEvent } from './dead-letter-event.entity';
import { Event } from './event.entity';
import { eventsEmitter } from './events.emitter';
import { IEvent } from './interfaces/event.interface';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(DeadLetterEvent)
    private readonly deadLetterEventRepository: Repository<DeadLetterEvent>,
  ) {}

  async publish(event: IEvent): Promise<Event> {
    const newEvent = this.eventRepository.create(event);
    const savedEvent = await this.eventRepository.save(newEvent);
    eventsEmitter.emit(event.topic, event);
    return savedEvent;
  }

  subscribe(topic: string, listener: (event: IEvent) => void): void {
    eventsEmitter.on(topic, async (event: IEvent) => {
      try {
        await listener(event);
      } catch (error) {
        this.handleFailedEvent(event, error);
      }
    });
  }

  async replay(): Promise<void> {
    const events = await this.eventRepository.find({
      order: { timestamp: 'ASC' },
    });
    for (const event of events) {
      eventsEmitter.emit(event.topic, event);
    }
  }

  private async handleFailedEvent(event: IEvent, error: Error): Promise<void> {
    const deadLetterEvent = this.deadLetterEventRepository.create({
      topic: event.topic,
      payload: event.payload,
      error: error.message,
    });
    await this.deadLetterEventRepository.save(deadLetterEvent);
  }
}
