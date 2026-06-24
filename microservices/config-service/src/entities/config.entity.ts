import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Environment } from './environment.entity';

@Entity('configurations')
export class Config {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'string' })
  type: 'string' | 'number' | 'boolean' | 'json';

  @Column({ type: 'boolean', default: false })
  isSecret: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  category: string;

  @Column({ type: 'varchar', nullable: true })
  tags: string;

  @ManyToOne(() => Environment, (env) => env.configs, { nullable: true })
  environment: Environment;

  @Column({ type: 'uuid', nullable: true })
  environmentId: string;

  @Column({ type: 'varchar', nullable: true })
  version: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', nullable: true })
  updatedBy: string;
}
