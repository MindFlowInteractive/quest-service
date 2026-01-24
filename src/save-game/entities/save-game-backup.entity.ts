import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SaveGame } from './save-game.entity';

export enum BackupReason {
  SCHEDULED = 'SCHEDULED',
  PRE_UPDATE = 'PRE_UPDATE',
  MANUAL = 'MANUAL',
  CONFLICT = 'CONFLICT',
  CORRUPTION_DETECTED = 'CORRUPTION_DETECTED',
}

@Entity('save_game_backups')
@Index(['saveGameId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['expiresAt'])
export class SaveGameBackup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  saveGameId: string;

  @ManyToOne(() => SaveGame, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'saveGameId' })
  saveGame: SaveGame;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'int' })
  slotId: number;

  @Column({ type: 'int' })
  saveVersion: number;

  @Column({
    type: 'enum',
    enum: BackupReason,
    default: BackupReason.SCHEDULED,
  })
  reason: BackupReason;

  @Column('bytea')
  compressedData: Buffer;

  @Column({ type: 'varchar', length: 64 })
  checksum: string;

  @Column({ type: 'int' })
  dataSize: number;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
