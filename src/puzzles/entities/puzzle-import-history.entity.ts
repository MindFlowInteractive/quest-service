import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ImportStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

@Entity('puzzle_import_history')
@Index(['adminId', 'createdAt'])
export class PuzzleImportHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  adminId: string;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 20 })
  format: string; // 'json' | 'csv' | 'yaml'

  @Column({ type: 'int' })
  totalRecords: number;

  @Column({ type: 'int', default: 0 })
  importedCount: number;

  @Column({ type: 'int', default: 0 })
  failedCount: number;

  @Column({ type: 'boolean', default: false })
  isDryRun: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: ImportStatus.SUCCESS,
  })
  status: ImportStatus;

  @Column({ type: 'jsonb', nullable: true })
  report: {
    dryRun: boolean;
    totalRecords: number;
    validCount: number;
    invalidCount: number;
    errors: Array<{
      row: number;
      title?: string;
      errors: string[];
    }>;
    importedIds?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;
}
