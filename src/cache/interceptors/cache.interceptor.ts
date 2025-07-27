import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from "@nestjs/common"
import type { Reflector } from "@nestjs/core"
import { type Observable, of } from "rxjs"
import { tap } from "rxjs/operators"
import type { CacheService } from "../services/cache.service"
import { CACHEABLE_KEY, type CacheableOptions } from "../decorators/cacheable.decorator"

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheableOptions = this.reflector.get<CacheableOptions>(CACHEABLE_KEY, context.getHandler())

    if (!cacheableOptions) {
      return next.handle()
    }

    const request = context.switchToHttp().getRequest()
    const args = context.getArgs()

    // Generate cache key
    const cacheKey = this.generateCacheKey(cacheableOptions, args, request)

    // Check condition
    if (cacheableOptions.condition && !cacheableOptions.condition(args)) {
      return next.handle()
    }

    // Try to get from cache
    const cachedResult = await this.cacheService.get(cacheKey, cacheableOptions)

    if (cachedResult !== null) {
      return of(cachedResult)
    }

    // Execute method and cache result
    return next.handle().pipe(
      tap(async (result) => {
        if (result !== undefined && result !== null) {
          await this.cacheService.set(cacheKey, result, cacheableOptions)
        }
      }),
    )
  }

  private generateCacheKey(options: CacheableOptions, args: any[], request: any): string {
    if (typeof options.key === "function") {
      return options.key(args)
    }

    if (typeof options.key === "string") {
      return options.key
    }

    // Default key generation
    const className = request.constructor.name
    const methodName = request.url || "unknown"
    const argsHash = this.hashArgs(args)

    return `${className}:${methodName}:${argsHash}`
  }

  private hashArgs(args: any[]): string {
    return Buffer.from(JSON.stringify(args)).toString("base64").slice(0, 16)
  }
}
