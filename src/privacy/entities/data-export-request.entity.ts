import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  DOWNLOADED = 'downloaded',
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  XML = 'xml',
  PDF = 'pdf',
}

export enum ExportScope {
  FULL = 'full',
  PROFILE_ONLY = 'profile_only',
  GAME_DATA_ONLY = 'game_data_only',
  TRANSACTIONS_ONLY = 'transactions_only',
  CUSTOM = 'custom',
}

@Entity('data_export_requests')
@Index(['userId'])
@Index(['status'])
@Index(['createdAt'])
export class DataExportRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  status: ExportStatus;

  @Column({
    name: 'format',
    type: 'enum',
    enum: ExportFormat,
    default: ExportFormat.JSON,
  })
  format: ExportFormat;

  @Column({
    name: 'scope',
    type: 'enum',
    enum: ExportScope,
    default: ExportScope.FULL,
  })
  scope: ExportScope;

  @Column({ type: 'jsonb', name: 'custom_entities', nullable: true })
  customEntities: string[];

  @Column({ name: 'file_url', nullable: true })
  fileUrl: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @Column({ name: 'downloaded_at', type: 'timestamptz', nullable: true })
  downloadedAt: Date;

  @Column({ name: 'download_count', type: 'int', default: 0 })
  downloadCount: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
