import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SaveGame } from '../entities/save-game.entity';
import { SaveType, SyncStatus, SaveGameData } from '../interfaces/save-game.interfaces';
import { SaveGameService } from './save-game.service';
import { CloudSyncService } from './cloud-sync.service';

export interface AutoSaveConfig {
  userId: string;
  slotId: number;
  intervalMs: number;
  enabled: boolean;
  lastAutoSave?: Date;
}

interface PendingAutoSave {
  userId: string;
  slotId: number;
  data: SaveGameData;
  timestamp: Date;
}

@Injectable()
export class AutoSaveService {
  private readonly logger = new Logger(AutoSaveService.name);

  // Store auto-save configurations per user
  private autoSaveConfigs = new Map<string, AutoSaveConfig>();

  // Queue for pending auto-saves (batched for performance)
  private pendingAutoSaves: PendingAutoSave[] = [];

  // Default auto-save interval: 5 minutes
  private readonly DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

  // Dedicated auto-save slot (slot 99 by default)
  private readonly AUTO_SAVE_SLOT = 99;

  // Quick save slot
  private readonly QUICK_SAVE_SLOT = 98;

  constructor(
    @InjectRepository(SaveGame)
    private readonly saveGameRepo: Repository<SaveGame>,
    private readonly saveGameService: SaveGameService,
    private readonly cloudSyncService: CloudSyncService,
  ) {}

  async enableAutoSave(
    userId: string,
    slotId: number = this.AUTO_SAVE_SLOT,
    intervalMs: number = this.DEFAULT_INTERVAL_MS,
  ): Promise<void> {
    const configKey = this.getConfigKey(userId, slotId);

    this.autoSaveConfigs.set(configKey, {
      userId,
      slotId,
      intervalMs,
      enabled: true,
    });

    this.logger.log(
      `Auto-save enabled for user ${userId}, slot ${slotId}, interval ${intervalMs}ms`,
    );
  }

  async disableAutoSave(userId: string, slotId: number = this.AUTO_SAVE_SLOT): Promise<void> {
    const configKey = this.getConfigKey(userId, slotId);
    const config = this.autoSaveConfigs.get(configKey);

    if (config) {
      config.enabled = false;
      this.autoSaveConfigs.set(configKey, config);
    }

    this.logger.log(`Auto-save disabled for user ${userId}, slot ${slotId}`);
  }

  async queueAutoSave(userId: string, data: SaveGameData, slotId?: number): Promise<void> {
    const targetSlot = slotId ?? this.AUTO_SAVE_SLOT;
    const configKey = this.getConfigKey(userId, targetSlot);
    const config = this.autoSaveConfigs.get(configKey);

    // Check if auto-save is enabled
    if (config && !config.enabled) {
      return;
    }

    // Check if enough time has passed since last auto-save
    if (config?.lastAutoSave) {
      const elapsed = Date.now() - config.lastAutoSave.getTime();
      if (elapsed < (config.intervalMs || this.DEFAULT_INTERVAL_MS)) {
        return;
      }
    }

    // Add to pending queue
    this.pendingAutoSaves.push({
      userId,
      slotId: targetSlot,
      data,
      timestamp: new Date(),
    });

    this.logger.debug(`Queued auto-save for user ${userId}, slot ${targetSlot}`);
  }

  async triggerAutoSave(userId: string, data: SaveGameData): Promise<SaveGame | null> {
    const slotId = this.AUTO_SAVE_SLOT;

    try {
      // Check if auto-save slot exists
      const existingSave = await this.saveGameRepo.findOne({
        where: { userId, slotId },
      });

      if (existingSave) {
        // Update existing auto-save
        return await this.saveGameService.update(userId, slotId, {
          data: {
            version: data.version,
            gameState: data.gameState,
            playerState: data.playerState,
            progressState: data.progressState,
            settings: data.settings,
          },
        });
      } else {
        // Create new auto-save
        return await this.saveGameService.create(userId, {
          slotId,
          slotName: 'Auto Save',
          saveType: SaveType.AUTO,
          data: {
            version: data.version,
            gameState: data.gameState,
            playerState: data.playerState,
            progressState: data.progressState,
            settings: data.settings,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Auto-save failed for user ${userId}: ${error.message}`);
      return null;
    }
  }

  async quickSave(userId: string, data: SaveGameData): Promise<SaveGame> {
    const slotId = this.QUICK_SAVE_SLOT;

    const existingSave = await this.saveGameRepo.findOne({
      where: { userId, slotId },
    });

    if (existingSave) {
      return await this.saveGameService.update(userId, slotId, {
        slotName: 'Quick Save',
        data: {
          version: data.version,
          gameState: data.gameState,
          playerState: data.playerState,
          progressState: data.progressState,
          settings: data.settings,
        },
      });
    }

    return await this.saveGameService.create(userId, {
      slotId,
      slotName: 'Quick Save',
      saveType: SaveType.QUICKSAVE,
      data: {
        version: data.version,
        gameState: data.gameState,
        playerState: data.playerState,
        progressState: data.progressState,
        settings: data.settings,
      },
    });
  }

  async quickLoad(userId: string): Promise<SaveGameData> {
    return await this.saveGameService.load(userId, this.QUICK_SAVE_SLOT);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingAutoSaves(): Promise<void> {
    if (this.pendingAutoSaves.length === 0) {
      return;
    }

    this.logger.debug(`Processing ${this.pendingAutoSaves.length} pending auto-saves`);

    // Group by user and slot, keeping only the latest
    const latestSaves = new Map<string, PendingAutoSave>();

    for (const pending of this.pendingAutoSaves) {
      const key = this.getConfigKey(pending.userId, pending.slotId);
      const existing = latestSaves.get(key);

      if (!existing || pending.timestamp > existing.timestamp) {
        latestSaves.set(key, pending);
      }
    }

    // Clear the queue
    this.pendingAutoSaves = [];

    // Process each unique save
    for (const [key, pending] of latestSaves) {
      try {
        await this.triggerAutoSave(pending.userId, pending.data);

        // Update last auto-save time
        const config = this.autoSaveConfigs.get(key);
        if (config) {
          config.lastAutoSave = new Date();
          this.autoSaveConfigs.set(key, config);
        }
      } catch (error) {
        this.logger.error(
          `Failed to process auto-save for ${key}: ${error.message}`,
        );
      }
    }
  }

  getAutoSaveConfig(userId: string, slotId: number = this.AUTO_SAVE_SLOT): AutoSaveConfig | null {
    const configKey = this.getConfigKey(userId, slotId);
    return this.autoSaveConfigs.get(configKey) || null;
  }

  private getConfigKey(userId: string, slotId: number): string {
    return `${userId}:${slotId}`;
  }
}
