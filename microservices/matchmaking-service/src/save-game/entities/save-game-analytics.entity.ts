import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('save_game_analytics')
@Index(['userId'], { unique: true })
export class SaveGameAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int', default: 0 })
  totalSaves: number;

  @Column({ type: 'int', default: 0 })
  totalLoads: number;

  @Column({ type: 'int', default: 0 })
  autoSaves: number;

  @Column({ type: 'int', default: 0 })
  manualSaves: number;

  @Column({ type: 'int', default: 0 })
  quickSaves: number;

  @Column({ type: 'int', default: 0 })
  cloudSyncs: number;

  @Column({ type: 'int', default: 0 })
  syncConflicts: number;

  @Column({ type: 'int', default: 0 })
  conflictsResolved: number;

  @Column({ type: 'int', default: 0 })
  corruptionEvents: number;

  @Column({ type: 'int', default: 0 })
  recoveryAttempts: number;

  @Column({ type: 'int', default: 0 })
  successfulRecoveries: number;

  @Column({ type: 'bigint', default: 0 })
  totalDataSaved: number; // Total bytes saved

  @Column({ type: 'float', default: 0 })
  averageSaveSize: number;

  @Column({ type: 'timestamp', nullable: true })
  lastSaveAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoadAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
