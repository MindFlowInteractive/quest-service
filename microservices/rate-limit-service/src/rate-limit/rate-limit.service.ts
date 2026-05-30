import { Injectable } from '@nestjs/common';
import { RateLimitEntry, Quota } from './rate-limit.entity';

const TIER_LIMITS = {
  free: { requestsPerMinute: 60, burstAllowance: 10 },
  premium: { requestsPerMinute: 600, burstAllowance: 100 },
};

const WINDOW_MS = 60_000;

@Injectable()
export class RateLimitService {
  private usage = new Map<string, RateLimitEntry>();
  private quotas = new Map<string, Quota>();

  private key(userId: string, endpoint: string) {
    return `${userId}:${endpoint}`;
  }

  setQuota(userId: string, tier: 'free' | 'premium', whitelisted = false): Quota {
    const limits = TIER_LIMITS[tier];
    const quota: Quota = { userId, tier, ...limits, whitelisted };
    this.quotas.set(userId, quota);
    return quota;
  }

  getQuota(userId: string): Quota {
    return this.quotas.get(userId) ?? this.setQuota(userId, 'free');
  }

  check(userId: string, endpoint: string): { allowed: boolean; remaining: number; resetAt: number } {
    const quota = this.getQuota(userId);
    if (quota.whitelisted) return { allowed: true, remaining: Infinity, resetAt: 0 };

    const k = this.key(userId, endpoint);
    const now = Date.now();
    let entry = this.usage.get(k);

    if (!entry || now - entry.windowStart >= WINDOW_MS) {
      entry = { userId, endpoint, tier: quota.tier, windowStart: now, count: 0, burstCount: 0, violations: entry?.violations ?? 0 };
    }

    const limit = quota.requestsPerMinute;
    const burst = quota.burstAllowance;
    const allowed = entry.count < limit || entry.burstCount < burst;

    if (allowed) {
      entry.count++;
      if (entry.count > limit) entry.burstCount++;
    } else {
      entry.violations++;
    }

    this.usage.set(k, entry);
    const remaining = Math.max(0, limit - entry.count);
    const resetAt = entry.windowStart + WINDOW_MS;
    return { allowed, remaining, resetAt };
  }

  getAnalytics(userId: string) {
    const entries: RateLimitEntry[] = [];
    for (const [, v] of this.usage) {
      if (v.userId === userId) entries.push(v);
    }
    return entries;
  }

  resetQuota(userId: string) {
    for (const [k, v] of this.usage) {
      if (v.userId === userId) this.usage.delete(k);
    }
    return { reset: true };
  }

  whitelist(userId: string, whitelisted: boolean) {
    const q = this.getQuota(userId);
    q.whitelisted = whitelisted;
    this.quotas.set(userId, q);
    return q;
  }
}
