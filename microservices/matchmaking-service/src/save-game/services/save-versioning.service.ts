import { Injectable, Logger } from '@nestjs/common';
import { SaveGameData } from '../interfaces/save-game.interfaces';

// Migration functions for each version upgrade
type MigrationFn = (data: SaveGameData) => SaveGameData;

interface VersionMigration {
  fromVersion: number;
  toVersion: number;
  migrate: MigrationFn;
}

@Injectable()
export class SaveVersioningService {
  private readonly logger = new Logger(SaveVersioningService.name);

  // Current schema version - increment when making breaking changes
  readonly CURRENT_VERSION = 1;

  // Define migrations between versions
  private migrations: VersionMigration[] = [
    // Example migration from v1 to v2:
    // {
    //   fromVersion: 1,
    //   toVersion: 2,
    //   migrate: (data) => ({
    //     ...data,
    //     version: 2,
    //     playerState: {
    //       ...data.playerState,
    //       newField: defaultValue,
    //     },
    //   }),
    // },
  ];

  isCompatible(version: number): boolean {
    // Check if we can migrate from this version to current
    if (version === this.CURRENT_VERSION) {
      return true;
    }

    // Check if migration path exists
    return this.canMigrate(version, this.CURRENT_VERSION);
  }

  private canMigrate(fromVersion: number, toVersion: number): boolean {
    if (fromVersion >= toVersion) {
      return fromVersion === toVersion;
    }

    // Find a migration path
    let currentVersion = fromVersion;
    while (currentVersion < toVersion) {
      const migration = this.migrations.find((m) => m.fromVersion === currentVersion);
      if (!migration) {
        return false;
      }
      currentVersion = migration.toVersion;
    }

    return currentVersion === toVersion;
  }

  migrateToCurrentVersion(data: SaveGameData): SaveGameData {
    if (data.version === this.CURRENT_VERSION) {
      return data;
    }

    if (data.version > this.CURRENT_VERSION) {
      this.logger.warn(
        `Save data version ${data.version} is newer than supported version ${this.CURRENT_VERSION}. ` +
        'Data may not load correctly.',
      );
      return data;
    }

    this.logger.log(`Migrating save data from v${data.version} to v${this.CURRENT_VERSION}`);

    let migratedData = { ...data };
    let currentVersion = data.version;

    while (currentVersion < this.CURRENT_VERSION) {
      const migration = this.migrations.find((m) => m.fromVersion === currentVersion);

      if (!migration) {
        throw new Error(
          `No migration path from version ${currentVersion} to ${this.CURRENT_VERSION}`,
        );
      }

      this.logger.debug(`Applying migration v${migration.fromVersion} -> v${migration.toVersion}`);
      migratedData = migration.migrate(migratedData);
      currentVersion = migration.toVersion;
    }

    return migratedData;
  }

  validateDataStructure(data: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Data must be an object'] };
    }

    const saveData = data as Record<string, unknown>;

    // Check required fields
    if (typeof saveData.version !== 'number') {
      errors.push('Missing or invalid version field');
    }

    if (!saveData.gameState || typeof saveData.gameState !== 'object') {
      errors.push('Missing or invalid gameState field');
    }

    if (!saveData.playerState || typeof saveData.playerState !== 'object') {
      errors.push('Missing or invalid playerState field');
    }

    if (!saveData.progressState || typeof saveData.progressState !== 'object') {
      errors.push('Missing or invalid progressState field');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  createDefaultSaveData(): SaveGameData {
    return {
      version: this.CURRENT_VERSION,
      gameState: {},
      playerState: {
        position: { x: 0, y: 0 },
        health: 100,
        inventory: [],
        stats: {},
      },
      progressState: {
        completedLevels: [],
        unlockedAchievements: [],
        collectibles: [],
      },
      settings: {},
    };
  }

  mergeWithDefaults(partialData: Partial<SaveGameData>): SaveGameData {
    const defaults = this.createDefaultSaveData();

    return {
      ...defaults,
      ...partialData,
      version: this.CURRENT_VERSION,
      playerState: {
        ...defaults.playerState,
        ...partialData.playerState,
      },
      progressState: {
        ...defaults.progressState,
        ...partialData.progressState,
      },
    };
  }
}
