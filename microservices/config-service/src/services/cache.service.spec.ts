import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  it('stores and invalidates config by prefix', () => {
    const cache = new CacheService(new ConfigService({ CACHE_TTL_SECONDS: 60 }));
    cache.set('config:api:dev', { enabled: true });
    expect(cache.get('config:api:dev')).toEqual({ enabled: true });
    cache.deleteByPrefix('config:api');
    expect(cache.get('config:api:dev')).toBeUndefined();
  });
});
