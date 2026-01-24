import { SetMetadata, applyDecorators } from "@nestjs/common"
import type { CacheOptions } from "../services/cache.service"

export const CACHEABLE_KEY = "cacheable"

export interface CacheableOptions extends CacheOptions {
  key?: string | ((args: any[]) => string)
  condition?: (args: any[]) => boolean
}

export function Cacheable(options: CacheableOptions = {}) {
  return applyDecorators(SetMetadata(CACHEABLE_KEY, options))
}

export function CacheEvict(options: { key?: string | ((args: any[]) => string); tags?: string[] | ((args: any[]) => string[]) } = {}) {
  return SetMetadata("cache_evict", options)
}

export function CachePut(options: CacheableOptions = {}) {
  return SetMetadata("cache_put", options)
}
