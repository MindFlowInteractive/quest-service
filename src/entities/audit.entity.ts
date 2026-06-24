import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { SmartContract } from './contract.entity';

@Entity('security_audits')
export class SecurityAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  auditorName: string;

  @Column()
  reportUrl: string;

  @Column()
  summary: string;

  @Column()
  findingsCount: number;

  @ManyToOne(() => SmartContract, (c) => c.audits)
  contract: SmartContract;

  @CreateDateColumn()
  createdAt: Date;
}