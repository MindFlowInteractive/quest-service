import { NotificationType } from '../enums/notification-type.enum';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  deduplicationKey?: string;
  aggregateKey?: string;
}
