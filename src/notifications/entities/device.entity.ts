import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  @Index({ unique: true })
  token: string;

  @Column({ type: 'varchar', length: 50, default: 'web' })
  platform: string; // ios, android, web

  @Column({ type: 'jsonb', default: {} })
  meta?: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
