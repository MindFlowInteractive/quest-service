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
import { Content } from './content.entity.js';

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
  codec?: string;
  pages?: number;
  checksum?: string;
  [key: string]: any;
}

@Entity('content_files')
@Index(['contentId', 'fileType'])
export class ContentFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  contentId: string;

  @ManyToOne(() => Content, (content) => content.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contentId' })
  content: Content;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 500 })
  @Index()
  storageKey: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({
    type: 'enum',
    enum: FileType,
  })
  @Index()
  fileType: FileType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cdnUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: FileMetadata;

  @Column({ type: 'boolean', default: false })
  @Index()
  isProcessed: boolean;

  @Column({ type: 'text', nullable: true })
  processingError: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
