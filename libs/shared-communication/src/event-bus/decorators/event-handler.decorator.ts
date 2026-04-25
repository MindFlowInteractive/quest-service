import { SetMetadata } from '@nestjs/common';
import { EventHandlerConfig } from '../../types/event.types';

export const EVENT_HANDLER_METADATA = 'EVENT_HANDLER_METADATA';

/**
 * Decorator to mark a method as an event handler
 * 
 * @example
 * ```typescript
 * @EventHandler({
 *   eventType: 'user.created',
 *   queue: 'notification-service.user-created',
 *   prefetchCount: 5,
 *   retryAttempts: 3
 * })
 * async handleUserCreated(event: BaseEvent<UserCreatedPayload>) {
 *   // Handle event
 * }
 * ```
 */
export const EventHandler = (config: EventHandlerConfig): MethodDecorator => {
  return SetMetadata(EVENT_HANDLER_METADATA, config);
};
