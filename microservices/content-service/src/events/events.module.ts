import { Module, forwardRef } from '@nestjs/common';
import { EventPublisherService } from './event-publisher.service.js';
import { EventSubscriberService } from './event-subscriber.service.js';
import { ContentModule } from '../content/content.module.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [
    forwardRef(() => ContentModule),
    StorageModule,
  ],
  providers: [EventPublisherService, EventSubscriberService],
  exports: [EventPublisherService],
})
export class EventsModule {}
