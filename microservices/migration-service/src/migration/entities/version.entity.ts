import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('schema_versions')
export class VersionEntity {
  @PrimaryColumn({ name: 'target_database' })
  targetDatabase: string;

  @Column({ type: 'int', default: 0 })
  version: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
