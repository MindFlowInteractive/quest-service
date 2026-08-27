import {
  Injectable,
  Inject,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import cdnConfig from './config/cdn.config';

export interface CdnAsset {
  url: string;
  cacheControl: string;
  etag: string;
  version: string;
}

export interface CdnMetrics {
  requests: number;
  cacheHits: number;
  cacheMisses: number;
  purgeRequests: number;
  purgeFailures: number;
  failoverRequests: number;
}

@Injectable()
export class CdnService {
  private readonly logger = new Logger(CdnService.name);
  private readonly httpClient: AxiosInstance;
  private readonly metrics: CdnMetrics = {
    requests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    purgeRequests: 0,
    purgeFailures: 0,
    failoverRequests: 0,
  };

  constructor(
    @Inject(cdnConfig.KEY)
    private readonly config: ConfigType<typeof cdnConfig>,
  ) {
    this.httpClient = axios.create({ timeout: 5000 });
  }

  resolveAsset(key: string, version: string | number = 1): CdnAsset {
    const normalizedKey = key.replace(/^\/+/, '').replace(/\s+/g, '-');
    const normalizedVersion = String(version).replace(/[^a-zA-Z0-9._-]/g, '');
    const baseUrl = this.config.primaryUrl || this.config.fallbackUrl;

    if (!baseUrl) {
      throw new ServiceUnavailableException('CDN is not configured');
    }

    return {
      url: `${baseUrl.replace(/\/$/, '')}/${normalizedKey}?v=${normalizedVersion}`,
      cacheControl: this.getCacheControl(normalizedVersion),
      etag: `"${normalizedKey}:${normalizedVersion}"`,
      version: normalizedVersion,
    };
  }

  recordRequest(cacheHit: boolean): void {
    this.metrics.requests += 1;
    if (cacheHit) this.metrics.cacheHits += 1;
    else this.metrics.cacheMisses += 1;
  }

  async purge(keys: string[]): Promise<{ purged: number; failed: boolean }> {
    const uniqueKeys = [...new Set(keys.map((key) => key.trim()).filter(Boolean))];
    if (uniqueKeys.length === 0) return { purged: 0, failed: false };

    this.metrics.purgeRequests += 1;
    if (!this.config.purgeUrl) {
      return { purged: uniqueKeys.length, failed: false };
    }

    try {
      await this.httpClient.post(
        this.config.purgeUrl,
        { keys: uniqueKeys },
        this.config.purgeToken
          ? { headers: { Authorization: `Bearer ${this.config.purgeToken}` } }
          : undefined,
      );
      return { purged: uniqueKeys.length, failed: false };
    } catch (error) {
      this.metrics.purgeFailures += 1;
      this.logger.error('CDN purge failed', error);
      return { purged: 0, failed: true };
    }
  }

  getMetrics(): CdnMetrics {
    return { ...this.metrics };
  }

  getCacheControl(version: string): string {
    const immutable = Boolean(version) && version !== 'latest';
    const ttl = immutable ? 31536000 : this.config.defaultTtlSeconds;
    return `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=${this.config.staleWhileRevalidateSeconds}${immutable ? ', immutable' : ''}`;
  }

  async healthCheck(): Promise<{ available: boolean; url: string }> {
    const primary = this.config.primaryUrl;
    if (!primary) return { available: Boolean(this.config.fallbackUrl), url: this.config.fallbackUrl };

    try {
      await this.httpClient.head(primary, { timeout: 2000 });
      return { available: true, url: primary };
    } catch {
      if (this.config.fallbackUrl) {
        this.metrics.failoverRequests += 1;
        return { available: true, url: this.config.fallbackUrl };
      }
      return { available: false, url: primary };
    }
  }
}
