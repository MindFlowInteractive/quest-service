import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf',
}

@Entity('exports')
export class Export {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  playerId: string;

  @Column({ type: 'enum', enum: ExportFormat, default: ExportFormat.JSON })
  format: ExportFormat;

  @Column({ type: 'enum', enum: ExportStatus, default: ExportStatus.PENDING })
  status: ExportStatus;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  encryptionKeyId: string;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
