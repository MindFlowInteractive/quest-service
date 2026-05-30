export interface RateLimitEntry {
  userId: string;
  endpoint: string;
  tier: 'free' | 'premium';
  windowStart: number;
  count: number;
  burstCount: number;
  violations: number;
}

export interface Quota {
  userId: string;
  tier: 'free' | 'premium';
  requestsPerMinute: number;
  burstAllowance: number;
  whitelisted: boolean;
}
