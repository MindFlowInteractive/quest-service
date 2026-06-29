import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connection, Integration, Webhook } from './entities';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
  ) {}

  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  startOAuth(provider: string, redirectUri: string) {
    const state = `${provider}:${Date.now()}`;
    const authorizationUrl = `https://auth.example.com/${provider}?redirect_uri=${encodeURIComponent(
      redirectUri || 'http://localhost:3009/oauth/' + provider + '/callback',
    )}&state=${encodeURIComponent(state)}`;
    return { provider, authorizationUrl, state };
  }

  async completeOAuth(provider: string, code: string, state?: string) {
    if (!code) {
      throw new NotFoundException('Missing OAuth code');
    }
    const connection = this.connectionRepository.create({ provider, externalId: state || 'unknown', accessToken: `token-${provider}-${code}` });
    return this.connectionRepository.save(connection);
  }

  async createConnection(provider: string, accountId: string) {
    const integration = this.integrationRepository.create({ provider, externalAccountId: accountId, status: 'connected' });
    return this.integrationRepository.save(integration);
  }

  async getConnections(provider: string) {
    return this.connectionRepository.find({ where: { provider } });
  }

  async registerWebhook(integration: string, callbackUrl: string) {
    const webhook = this.webhookRepository.create({ integration, callbackUrl, isActive: true });
    return this.webhookRepository.save(webhook);
  }

  async invokeWebhook(id: number, payload: Record<string, unknown>) {
    const webhook = await this.webhookRepository.findOne({ where: { id } });
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    return { webhook, payload, status: 'delivered' };
  }
}
