export interface EmailMessage {
  to: string;
  toName?: string;
  from: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  metadata?: Record<string, any>;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  rawResponse?: any;
}

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<SendResult>;
  sendBatch?(messages: EmailMessage[]): Promise<SendResult[]>;
  validateConfig(): boolean;
}
