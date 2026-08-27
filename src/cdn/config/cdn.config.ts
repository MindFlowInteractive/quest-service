import { registerAs } from '@nestjs/config';

export default registerAs('cdn', () => ({
  primaryUrl: process.env.CDN_BASE_URL || '',
  fallbackUrl: process.env.CDN_FALLBACK_URL || '',
  provider: process.env.CDN_PROVIDER || 'generic',
  purgeUrl: process.env.CDN_PURGE_URL || '',
  purgeToken: process.env.CDN_PURGE_TOKEN || '',
  defaultTtlSeconds: Number.parseInt(
    process.env.CDN_DEFAULT_TTL_SECONDS || '86400',
    10,
  ),
  staleWhileRevalidateSeconds: Number.parseInt(
    process.env.CDN_STALE_WHILE_REVALIDATE_SECONDS || '3600',
    10,
  ),
}));
