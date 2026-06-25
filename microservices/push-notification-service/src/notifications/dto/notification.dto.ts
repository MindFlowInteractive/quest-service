import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import {
  PushNotificationType,
  PushNotificationPriority,
} from '../entities/push-notification.entity';

export class SendPushNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(PushNotificationType)
  @IsOptional()
  type?: PushNotificationType;

  @IsEnum(PushNotificationPriority)
  @IsOptional()
  priority?: PushNotificationPriority;
}

export class SchedulePushNotificationDto extends SendPushNotificationDto {
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;
}

export class BroadcastPushNotificationDto {
  @IsString()
  @IsNotEmpty()
  segmentId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(PushNotificationType)
  @IsOptional()
  type?: PushNotificationType;

  @IsEnum(PushNotificationPriority)
  @IsOptional()
  priority?: PushNotificationPriority;
}
