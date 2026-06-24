export type SmsProviderRequest = {
  to: string;
  from: string;
  body: string;
  metadata?: Record<string, any>;
};

export type SmsProviderResponse = {
  provider: string;
  messageId: string;
  status: 'sent' | 'queued';
};

export interface SmsProvider {
  readonly name: string;
  send(request: SmsProviderRequest): Promise<SmsProviderResponse>;
}
