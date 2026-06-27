import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('config_versions')
@Index(['resourceType', 'resourceId', 'version'])
export class ConfigVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  resourceType: 'config' | 'secret';

  @Column('uuid')
  resourceId: string;

  @Column()
  version: number;

  @Column({ type: 'jsonb' })
  snapshot: Record<string, unknown>;

  @Column({ nullable: true })
  changedBy?: string;

  @CreateDateColumn()
  createdAt: Date;
}
