import { IsUUID } from 'class-validator';

export class NotificationAckDto {
  @IsUUID()
  notificationId: string;
}
