export class CreateWebhookSubscriptionDto {
  serviceName: string;
  webhookUrl: string;
  events?: string[];
  secret?: string;
}

export class UpdateWebhookSubscriptionDto {
  webhookUrl?: string;
  events?: string[];
  isActive?: boolean;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export class WebhookSubscriptionResponseDto {
  id: string;
  serviceName: string;
  webhookUrl: string;
  events: string[];
  isActive: boolean;
  retryAttempts: number;
  retryDelayMs: number;
  createdAt: Date;
  updatedAt: Date;
}
