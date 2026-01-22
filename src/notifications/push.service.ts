import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(private readonly config: any) {
    const key = this.config.get('FCM_SERVICE_ACCOUNT_JSON');
    if (key) {
      try {
        const serviceAccount = JSON.parse(key as string);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        this.enabled = true;
        this.logger.log('FCM initialized');
      } catch (err) {
        this.logger.error('Failed to initialize FCM', err as any);
      }
    } else {
      this.logger.log('FCM not configured; push disabled');
    }
  }

  async sendToToken(token: string, payload: any) {
    if (!this.enabled) {
      this.logger.debug('Push disabled - token would be:', token);
      // In production we would enqueue to a retry queue; for now return queued
      return { success: false, queued: true };
    }
    try {
      const message: any = { token, notification: payload as any } as any;
      const res = await admin.messaging().send(message);
      return { success: true, result: res };
    } catch (err) {
      this.logger.error('FCM send failed', err as any);
      return { success: false, error: err };
    }
  }
}
