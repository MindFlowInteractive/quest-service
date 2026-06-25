import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { License } from './license.entity';

@Entity('activations')
export class Activation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => License, { eager: true })
  @JoinColumn({ name: 'licenseId' })
  license: License;

  @Column()
  deviceId: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  activatedAt: Date;

  @Column({ nullable: true })
  offlineToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
