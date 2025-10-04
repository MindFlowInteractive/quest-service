export class CreateNotificationDto {
  userIds?: string[];
  segment?: { key: string; value: any };
  type: string;
  title: string;
  body?: string;
  meta?: any;
  sendAt?: Date;
  variantId?: string;
}
