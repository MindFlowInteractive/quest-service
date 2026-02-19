import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = !!this.configService.get<string>('FCM_SERVER_KEY');
    if (!this.enabled) {
      this.logger.warn('Push notifications disabled - FCM_SERVER_KEY not configured');
    }
  }

  async sendToToken(token: string, payload: PushPayload) {
    if (!this.enabled) {
      this.logger.debug('Push disabled - token would be:', token);
      return { success: false, queued: true };
    }
    try {
      this.logger.log(`Sending push to token: ${token.substring(0, 10)}...`);
      // FCM integration placeholder
      return { success: true };
    } catch (err) {
      this.logger.error('Push send failed', err as any);
      return { success: false, error: err };
    }
  }
}
