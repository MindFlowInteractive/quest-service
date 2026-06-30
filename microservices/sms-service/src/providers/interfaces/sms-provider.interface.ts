export interface SmsPayload {
  to: string;
  body: string;
  from?: string;
  metadata?: Record<string, any>;
  statusCallbackUrl?: string;
}

export interface SmsSendResult {
  success: boolean;
  provider: string;
  messageId?: string;
  segments?: number;
  error?: string;
  rawResponse?: Record<string, any>;
  deliveryStatus?: 'sent' | 'delivered';
}

export interface SmsProvider {
  name: string;
  send(payload: SmsPayload): Promise<SmsSendResult>;
  validateConfig(): boolean;
}
