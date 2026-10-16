import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExportCadence, ExportFormat } from '../data-portability.types';

@Entity('player_export_schedules')
@Index(['playerId', 'enabled', 'nextRunAt'])
export class PlayerExportSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'enum', enum: ExportFormat })
  format: ExportFormat;

  @Column({ type: 'enum', enum: ExportCadence })
  cadence: ExportCadence;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'timestamptz' })
  nextRunAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
