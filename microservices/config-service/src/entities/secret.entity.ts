import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('secrets')
export class Secret {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  category: string;

  @Column({ type: 'varchar', default: 'aes-256-cbc' })
  encryptionAlgorithm: string;

  @Column({ type: 'text', nullable: true })
  encryptedValue: string;

  @Column({ type: 'text', nullable: true })
  iv: string;

  @Column({ type: 'timestamp', nullable: true })
  lastRotatedAt: Date;

  @Column({ type: 'int', default: 0 })
  rotationCount: number;

  @Column({ type: 'int', default: 7776000 })
  rotationIntervalSeconds: number;

  @Column({ type: 'boolean', default: false })
  requiresRotation: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', nullable: true })
  updatedBy: string;
}
