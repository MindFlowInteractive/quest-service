import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Webhook } from './entities/webhook.entity';
import * as crypto from 'crypto';

export interface WebhookPayload {
    eventType: string;
    data: any;
    timestamp: string;
}

export interface WebhookResult {
    success: boolean;
    statusCode?: number;
    error?: string;
}

@Injectable()
export class WebhookProvider {
    private readonly logger = new Logger(WebhookProvider.name);

    constructor(private readonly httpService: HttpService) {}

    async send(webhook: Webhook, payload: WebhookPayload): Promise<WebhookResult> {
        try {
            const signature = this.generateSignature(payload, webhook.secret);
            
            const response = await this.httpService.axiosRef.post(webhook.url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Timestamp': payload.timestamp,
                },
                timeout: 5000, // 5 second timeout
            });

            this.logger.log(`Webhook sent successfully to ${webhook.url} (status: ${response.status})`);
            
            return {
                success: true,
                statusCode: response.status,
            };
        } catch (error) {
            this.logger.error(`Webhook failed for ${webhook.url}: ${error.message}`);
            
            return {
                success: false,
                statusCode: error.response?.status,
                error: error.message,
            };
        }
    }

    private generateSignature(payload: WebhookPayload, secret: string): string {
        if (!secret) return '';
        
        const payloadString = JSON.stringify(payload);
        return crypto
            .createHmac('sha256', secret)
            .update(payloadString)
            .digest('hex');
    }

    verifySignature(payload: string, signature: string, secret: string): boolean {
        if (!secret) return true; // Skip verification if no secret
        
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature),
        );
    }
}
