import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeadLetterEvent } from './dead-letter-event.entity';

@Injectable()
export class DeadLetterService {
  constructor(
    @InjectRepository(DeadLetterEvent)
    private readonly deadLetterEventRepository: Repository<DeadLetterEvent>,
  ) {}

  async replay(): Promise<void> {
    // Replay logic will go here
  }
}
