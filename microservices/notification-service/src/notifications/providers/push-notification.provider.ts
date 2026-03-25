import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushResult {
  successCount: number;
  failureCount: number;
  staleTokens: string[];
}

const BATCH_SIZE = 500;
const STALE_ERROR_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
];

@Injectable()
export class PushNotificationProvider implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationProvider.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length > 0) return;

    const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
    if (!serviceAccountPath) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_PATH not set — push notifications disabled');
      return;
    }

    try {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      this.logger.log('Firebase Admin SDK initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', (error as Error).stack);
    }
  }

  async sendToTokens(tokens: string[], payload: PushPayload): Promise<PushResult> {
    if (!tokens.length) return { successCount: 0, failureCount: 0, staleTokens: [] };

    const message = {
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    const staleTokens = this.extractStaleTokens(tokens, response);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      staleTokens,
    };
  }

  async sendBroadcast(tokens: string[], payload: PushPayload): Promise<PushResult> {
    if (!tokens.length) return { successCount: 0, failureCount: 0, staleTokens: [] };

    let totalSuccess = 0;
    let totalFailure = 0;
    const allStaleTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const result = await this.sendToTokens(batch, payload);
      totalSuccess += result.successCount;
      totalFailure += result.failureCount;
      allStaleTokens.push(...result.staleTokens);
    }

    this.logger.log(`Broadcast sent: ${totalSuccess} success, ${totalFailure} failure, ${allStaleTokens.length} stale`);

    return {
      successCount: totalSuccess,
      failureCount: totalFailure,
      staleTokens: allStaleTokens,
    };
  }

  private extractStaleTokens(tokens: string[], response: admin.messaging.BatchResponse): string[] {
    const staleTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (resp.error && STALE_ERROR_CODES.includes(resp.error.code)) {
        staleTokens.push(tokens[idx]);
      }
    });
    return staleTokens;
  }
}
