import { Injectable } from "@nestjs/common"
import { Cacheable, CacheEvict } from "../decorators/cacheable.decorator"
import type { CacheService } from "../services/cache.service"
import type { InvalidationService } from "../strategies/invalidation.service"

export interface User {
  id: string
  name: string
  email: string
  lastLogin?: Date
}

@Injectable()
export class UserService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly invalidationService: InvalidationService,
  ) {}

  @Cacheable({
    key: (args) => `user:${args[0]}:profile`,
    ttl: 3600,
    tags: (args) => [`user:${args[0]}`, "user-profiles"],
  })
  async getUserProfile(userId: string): Promise<User | null> {
    // Simulate database query
    console.log(`Fetching user profile from database: ${userId}`)

    // This would typically be a database call
    return {
      id: userId,
      name: "John Doe",
      email: "john@example.com",
      lastLogin: new Date(),
    }
  }

  @Cacheable({
    key: (args) => `user:${args[0]}:settings`,
    ttl: 1800,
    tags: (args) => [`user:${args[0]}`, "user-settings"],
  })
  async getUserSettings(userId: string): Promise<Record<string, any>> {
    console.log(`Fetching user settings from database: ${userId}`)

    return {
      theme: "dark",
      notifications: true,
      language: "en",
    }
  }

  @CacheEvict({
    key: (args) => `user:${args[0].id}:profile`,
    tags: (args) => [`user:${args[0].id}`, "user-profiles"],
  })
  async updateUserProfile(user: User): Promise<User> {
    console.log(`Updating user profile in database: ${user.id}`)

    // Invalidate related cache
    await this.invalidationService.invalidateByUser(user.id)

    // This would typically be a database update
    return user
  }

  async deleteUser(userId: string): Promise<void> {
    console.log(`Deleting user from database: ${userId}`)

    // Invalidate all user-related cache
    await this.invalidationService.invalidateByUser(userId)
  }

  // Example of manual cache management
  async cacheUserSession(sessionId: string, userId: string): Promise<void> {
    await this.cacheService.set(
      `session:${sessionId}`,
      { userId, createdAt: new Date() },
      { ttl: 1800, tags: [`user:${userId}`, "sessions"] },
    )
  }

  async getUserSession(sessionId: string): Promise<any> {
    return await this.cacheService.get(`session:${sessionId}`)
  }
}
