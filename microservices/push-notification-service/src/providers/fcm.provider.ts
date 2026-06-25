import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin/app';
import {
  BatchResponse,
  getMessaging,
  MulticastMessage,
} from 'firebase-admin/messaging';
import { readFileSync } from 'fs';

export interface PushPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

export interface PushResult {
  successCount: number;
  failureCount: number;
  staleTokens: string[];
  responses: Array<{
    token: string;
    success: boolean;
    messageId?: string;
    errorCode?: string;
    errorMessage?: string;
  }>;
}

const BATCH_SIZE = 500;
const STALE_ERROR_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
];

@Injectable()
export class FcmProvider implements OnModuleInit {
  private readonly logger = new Logger(FcmProvider.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (getApps().length > 0) {
      this.initialized = true;
      return;
    }

    const serviceAccountPath = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_PATH',
    );
    if (!serviceAccountPath) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_PATH not set — push notifications disabled',
      );
      return;
    }

    try {
      const serviceAccount = JSON.parse(
        readFileSync(serviceAccountPath, 'utf8'),
      ) as ServiceAccount;
      initializeApp({
        credential: cert(serviceAccount),
      });
      this.initialized = true;
      this.logger.log('Firebase Admin SDK initialized');
    } catch (error) {
      this.logger.error(
        'Failed to initialize Firebase Admin SDK',
        (error as Error).stack,
      );
    }
  }

  isReady(): boolean {
    return this.initialized;
  }

  async sendToTokens(tokens: string[], payload: PushPayload): Promise<PushResult> {
    if (!tokens.length) {
      return { successCount: 0, failureCount: 0, staleTokens: [], responses: [] };
    }

    if (!this.initialized) {
      this.logger.warn('Firebase not initialized, skipping push send');
      return {
        successCount: 0,
        failureCount: tokens.length,
        staleTokens: [],
        responses: tokens.map((token) => ({
          token,
          success: false,
          errorCode: 'not-initialized',
          errorMessage: 'Firebase Admin SDK not initialized',
        })),
      };
    }

    const message: MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
      },
      data: payload.data,
    };

    const response = await getMessaging().sendEachForMulticast(message);
    const staleTokens = this.extractStaleTokens(tokens, response);

    const responses = response.responses.map((resp, idx) => ({
      token: tokens[idx],
      success: resp.success,
      messageId: resp.messageId || undefined,
      errorCode: resp.error?.code || undefined,
      errorMessage: resp.error?.message || undefined,
    }));

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      staleTokens,
      responses,
    };
  }

  async sendBroadcast(tokens: string[], payload: PushPayload): Promise<PushResult> {
    if (!tokens.length) {
      return { successCount: 0, failureCount: 0, staleTokens: [], responses: [] };
    }

    let totalSuccess = 0;
    let totalFailure = 0;
    const allStaleTokens: string[] = [];
    const allResponses: PushResult['responses'] = [];

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const result = await this.sendToTokens(batch, payload);
      totalSuccess += result.successCount;
      totalFailure += result.failureCount;
      allStaleTokens.push(...result.staleTokens);
      allResponses.push(...result.responses);
    }

    this.logger.log(
      `Broadcast sent: ${totalSuccess} success, ${totalFailure} failure, ${allStaleTokens.length} stale`,
    );

    return {
      successCount: totalSuccess,
      failureCount: totalFailure,
      staleTokens: allStaleTokens,
      responses: allResponses,
    };
  }

  private extractStaleTokens(
    tokens: string[],
    response: BatchResponse,
  ): string[] {
    const staleTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (resp.error && STALE_ERROR_CODES.includes(resp.error.code)) {
        staleTokens.push(tokens[idx]);
      }
    });
    return staleTokens;
  }
}
