export interface Sponsor {
  id: string;
  name: string;
  metadata?: Record<string, any>;
}

export interface Campaign {
  id: string;
  sponsorId: string;
  title: string;
  scheduledAt?: number;
  performance?: { impressions: number; clicks: number };
}

export interface Collaboration {
  id: string;
  campaignId: string;
  influencerId: string;
  payout: number;
  delivered?: boolean;
}
