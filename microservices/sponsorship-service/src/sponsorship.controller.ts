import { Body, Controller, Post } from '@nestjs/common';
import { SponsorshipService } from './sponsorship.service';

@Controller()
export class SponsorshipController {
  constructor(private readonly svc: SponsorshipService) {}

  @Post('sponsors')
  createSponsor(@Body() body: { name: string; metadata?: Record<string, any> }) {
    return this.svc.createSponsor(body.name, body.metadata);
  }

  @Post('campaigns')
  createCampaign(@Body() body: { sponsorId: string; title: string; scheduledAt?: number }) {
    return this.svc.createCampaign(body.sponsorId, body.title, body.scheduledAt) || { error: 'invalid_sponsor' };
  }

  @Post('collaborations')
  addCollaboration(@Body() body: { campaignId: string; influencerId: string; payout: number }) {
    return this.svc.addCollaboration(body.campaignId, body.influencerId, body.payout) || { error: 'invalid_campaign' };
  }

  @Post('campaigns/:id/performance')
  recordPerformance(@Body() body: { campaignId: string; impressions: number; clicks: number }) {
    return { ok: this.svc.recordPerformance(body.campaignId, body.impressions, body.clicks) };
  }

  @Post('collaborations/:id/payout')
  payout(@Body() body: { collaborationId: string }) {
    return { ok: this.svc.payout(body.collaborationId) };
  }
}
