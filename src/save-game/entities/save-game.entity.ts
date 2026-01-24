import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  SyncStatus,
  SaveType,
  SaveGameMetadata,
  SaveGameData,
  SaveGameChecksum,
  CompressionInfo,
  EncryptionInfo,
} from '../interfaces/save-game.interfaces';

@Entity('save_games')
@Index(['userId', 'slotId'], { unique: true })
@Index(['userId', 'syncStatus'])
@Index(['lastModifiedAt'])
export class SaveGame {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  slotId: number;

  @Column({ type: 'varchar', length: 100, default: 'Save Slot' })
  slotName: string;

  @Column({
    type: 'enum',
    enum: SaveType,
    default: SaveType.MANUAL,
  })
  saveType: SaveType;

  @Column({ type: 'int', default: 1 })
  version: number; // Schema version for backward compatibility

  @Column({ type: 'int', default: 1 })
  saveVersion: number; // Increments each time save is updated

  @Column('jsonb')
  metadata: SaveGameMetadata;

  @Column('bytea', { nullable: true })
  compressedData: Buffer | null; // Compressed and optionally encrypted save data

  @Column('jsonb', { nullable: true })
  rawData: SaveGameData | null; // Uncompressed data (for development/debugging)

  @Column('jsonb', { nullable: true })
  checksum: SaveGameChecksum;

  @Column('jsonb', { nullable: true })
  compressionInfo: CompressionInfo;

  @Column('jsonb', { nullable: true })
  encryptionInfo: EncryptionInfo;

  @Column({
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.LOCAL_ONLY,
  })
  syncStatus: SyncStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @Column({ type: 'timestamp' })
  lastModifiedAt: Date;

  @Column({ type: 'varchar', length: 64, nullable: true })
  deviceId: string; // Identifies the device that made the last change

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform: string; // Platform identifier (web, ios, android, etc.)

  @Column({ type: 'boolean', default: false })
  isCorrupted: boolean;

  @Column({ type: 'varchar', nullable: true })
  corruptionReason: string;

  @Column({ type: 'int', default: 0 })
  loadCount: number;

  @Column({ type: 'int', default: 0 })
  saveCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
