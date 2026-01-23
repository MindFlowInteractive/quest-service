/**
 * Save Game Interfaces
 * Following best practices for cloud sync systems:
 * - https://docs.aws.amazon.com/gamekit/latest/UnrealDevGuide/game-save-howitworks.html
 * - https://learn.microsoft.com/en-us/gaming/gdk/docs/gdk-dev/pc-dev/tutorials/pc-e2e-guide/e2e-services/e2e-cloud-saves
 */

export enum SyncStatus {
  LOCAL_ONLY = 'LOCAL_ONLY',           // Save exists only locally
  CLOUD_ONLY = 'CLOUD_ONLY',           // Save exists only in cloud
  SYNCED = 'SYNCED',                   // Local and cloud are in sync
  LOCAL_NEWER = 'LOCAL_NEWER',         // Local save is more recent
  CLOUD_NEWER = 'CLOUD_NEWER',         // Cloud save is more recent
  CONFLICT = 'CONFLICT',               // Conflicting changes detected
}

export enum SaveType {
  AUTO = 'AUTO',         // Automatic checkpoint save
  MANUAL = 'MANUAL',     // Player-initiated save
  QUICKSAVE = 'QUICKSAVE', // Quick save slot
}

export enum ConflictResolution {
  USE_LOCAL = 'USE_LOCAL',       // Keep local version
  USE_CLOUD = 'USE_CLOUD',       // Keep cloud version
  USE_NEWEST = 'USE_NEWEST',     // Automatically use newest
  MERGE = 'MERGE',               // Attempt to merge (if supported)
  KEEP_BOTH = 'KEEP_BOTH',       // Create a new slot with cloud version
}

export interface SaveGameMetadata {
  slotId: number;
  slotName: string;
  saveType: SaveType;
  playtime: number;          // Total playtime in seconds
  level?: number;
  chapter?: string;
  thumbnailUrl?: string;
  customData?: Record<string, unknown>;
}

export interface SaveGameData {
  version: number;              // Schema version for backward compatibility
  gameState: Record<string, unknown>;
  playerState: {
    position?: { x: number; y: number; z?: number };
    health?: number;
    inventory?: unknown[];
    stats?: Record<string, number>;
    [key: string]: unknown;
  };
  progressState: {
    completedLevels?: string[];
    unlockedAchievements?: string[];
    collectibles?: string[];
    [key: string]: unknown;
  };
  settings?: Record<string, unknown>;
}

export interface SaveGameChecksum {
  algorithm: 'sha256' | 'md5';
  value: string;
}

export interface CompressionInfo {
  algorithm: 'gzip' | 'lz4' | 'none';
  originalSize: number;
  compressedSize: number;
}

export interface EncryptionInfo {
  algorithm: 'aes-256-gcm';
  iv: string;  // Initialization vector (base64)
  tag: string; // Auth tag (base64)
}

export interface CloudSyncResult {
  success: boolean;
  syncStatus: SyncStatus;
  localSave?: SaveGameSummary;
  cloudSave?: SaveGameSummary;
  conflictDetails?: ConflictDetails;
  error?: string;
}

export interface ConflictDetails {
  localLastModified: Date;
  cloudLastModified: Date;
  localChecksum: string;
  cloudChecksum: string;
  suggestedResolution: ConflictResolution;
}

export interface SaveGameSummary {
  id: string;
  slotId: number;
  slotName: string;
  version: number;
  checksum: string;
  lastModifiedAt: Date;
  playtime: number;
  isCompressed: boolean;
  isEncrypted: boolean;
}

export interface SaveAnalytics {
  totalSaves: number;
  totalLoads: number;
  autoSaves: number;
  manualSaves: number;
  cloudSyncs: number;
  syncConflicts: number;
  corruptionEvents: number;
  lastSaveAt?: Date;
  lastLoadAt?: Date;
  averageSaveSize: number;
}

export interface BackupInfo {
  id: string;
  saveGameId: string;
  createdAt: Date;
  reason: 'SCHEDULED' | 'PRE_UPDATE' | 'MANUAL' | 'CONFLICT';
  expiresAt: Date;
}
