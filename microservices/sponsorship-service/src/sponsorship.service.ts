import { Injectable } from '@nestjs/common';
import { Sponsor, Campaign, Collaboration } from './entities';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SponsorshipService {
  private sponsors = new Map<string, Sponsor>();
  private campaigns = new Map<string, Campaign>();
  private collaborations = new Map<string, Collaboration>();

  createSponsor(name: string, metadata?: Record<string, any>): Sponsor {
    const id = uuidv4();
    const s: Sponsor = { id, name, metadata };
    this.sponsors.set(id, s);
    return s;
  }

  createCampaign(sponsorId: string, title: string, scheduledAt?: number): Campaign | null {
    if (!this.sponsors.has(sponsorId)) return null;
    const id = uuidv4();
    const c: Campaign = { id, sponsorId, title, scheduledAt, performance: { impressions: 0, clicks: 0 } };
    this.campaigns.set(id, c);
    return c;
  }

  addCollaboration(campaignId: string, influencerId: string, payout: number): Collaboration | null {
    if (!this.campaigns.has(campaignId)) return null;
    const id = uuidv4();
    const col: Collaboration = { id, campaignId, influencerId, payout, delivered: false };
    this.collaborations.set(id, col);
    return col;
  }

  recordPerformance(campaignId: string, impressions: number, clicks: number) {
    const c = this.campaigns.get(campaignId);
    if (!c) return false;
    c.performance = c.performance || { impressions: 0, clicks: 0 };
    c.performance.impressions += impressions;
    c.performance.clicks += clicks;
    this.campaigns.set(c.id, c);
    return true;
  }

  payout(collaborationId: string): boolean {
    const col = this.collaborations.get(collaborationId);
    if (!col || col.delivered) return false;
    col.delivered = true;
    this.collaborations.set(col.id, col);
    return true;
  }
}
