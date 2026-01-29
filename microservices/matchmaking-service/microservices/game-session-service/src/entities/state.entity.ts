import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Session } from './session.entity';

export enum SnapshotType {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL',
  CHECKPOINT = 'CHECKPOINT',
}

@Entity('state_snapshots')
@Index(['sessionId', 'createdAt'])
@Index(['sessionId', 'snapshotType'])
export class StateSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  sessionId: string;

  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId', referencedColumnName: 'sessionId' })
  session: Session;

  @Column({
    type: 'enum',
    enum: SnapshotType,
    default: SnapshotType.INCREMENTAL,
  })
  snapshotType: SnapshotType;

  @Column({ type: 'int', default: 0 })
  moveNumber: number;

  @Column({ type: 'jsonb' })
  state: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  previousState?: Record<string, any>; // For incremental snapshots

  @Column({ type: 'jsonb', nullable: true })
  changes?: Record<string, any>; // Delta changes for incremental snapshots

  @Column({ type: 'varchar', length: 255, nullable: true })
  checkpointName?: string;

  @Column({ type: 'boolean', default: false })
  isRestorePoint: boolean;

  @Column({ type: 'int', nullable: true })
  sizeBytes?: number; // Size of snapshot data

  @CreateDateColumn()
  createdAt: Date;
}
