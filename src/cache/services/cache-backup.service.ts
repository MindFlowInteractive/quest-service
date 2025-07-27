import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import Redis from "ioredis"
import * as fs from "fs/promises"
import * as path from "path"

@Injectable()
export class CacheBackupService {
  private readonly logger = new Logger(CacheBackupService.name)
  private readonly backupDir = process.env.CACHE_BACKUP_DIR || "./cache-backups"
  private redis: Redis

  constructor() {
    this.redis = new Redis()
    this.ensureBackupDirectory()
  }

  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const backupFile = path.join(this.backupDir, `cache-backup-${timestamp}.json`)

      // Get all keys
      const keys = await this.redis.keys("*")
      const backup: Record<string, any> = {}

      // Get all key-value pairs
      for (const key of keys) {
        const type = await this.redis.type(key)

        switch (type) {
          case "string":
            backup[key] = { type, value: await this.redis.get(key) }
            break
          case "hash":
            backup[key] = { type, value: await this.redis.hgetall(key) }
            break
          case "list":
            backup[key] = { type, value: await this.redis.lrange(key, 0, -1) }
            break
          case "set":
            backup[key] = { type, value: await this.redis.smembers(key) }
            break
          case "zset":
            backup[key] = { type, value: await this.redis.zrange(key, 0, -1, "WITHSCORES") }
            break
        }
      }

      await fs.writeFile(backupFile, JSON.stringify(backup, null, 2))
      this.logger.log(`Cache backup created: ${backupFile}`)

      return backupFile
    } catch (error) {
      this.logger.error("Error creating cache backup:", error)
      throw error
    }
  }

  async restoreBackup(backupFile: string): Promise<void> {
    try {
      const backupData = await fs.readFile(backupFile, "utf-8")
      const backup = JSON.parse(backupData)

      const pipeline = this.redis.pipeline()

      for (const [key, data] of Object.entries(backup as Record<string, any>)) {
        switch (data.type) {
          case "string":
            pipeline.set(key, data.value)
            break
          case "hash":
            pipeline.hmset(key, data.value)
            break
          case "list":
            pipeline.del(key)
            if (data.value.length > 0) {
              pipeline.lpush(key, ...data.value.reverse())
            }
            break
          case "set":
            pipeline.del(key)
            if (data.value.length > 0) {
              pipeline.sadd(key, ...data.value)
            }
            break
          case "zset":
            pipeline.del(key)
            if (data.value.length > 0) {
              pipeline.zadd(key, ...data.value)
            }
            break
        }
      }

      await pipeline.exec()
      this.logger.log(`Cache restored from backup: ${backupFile}`)
    } catch (error) {
      this.logger.error("Error restoring cache backup:", error)
      throw error
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.backupDir)
      return files
        .filter((file) => file.startsWith("cache-backup-") && file.endsWith(".json"))
        .sort()
        .reverse()
    } catch (error) {
      this.logger.error("Error listing backups:", error)
      return []
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  private async scheduledBackup(): Promise<void> {
    if (process.env.CACHE_BACKUP_ENABLED === "true") {
      await this.createBackup()
      await this.cleanupOldBackups()
    }
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir)
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true })
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups()
      const retention = Number.parseInt(process.env.CACHE_BACKUP_RETENTION || "7")

      if (backups.length > retention) {
        const toDelete = backups.slice(retention)

        for (const backup of toDelete) {
          await fs.unlink(path.join(this.backupDir, backup))
          this.logger.log(`Deleted old backup: ${backup}`)
        }
      }
    } catch (error) {
      this.logger.error("Error cleaning up old backups:", error)
    }
  }
}
