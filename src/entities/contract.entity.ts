import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ContractVersion } from './version.entity';
import { SecurityAudit } from './audit.entity';

export enum ContractStatus {
  VERIFIED = 'verified',
  UNVERIFIED = 'unverified',
  DEPRECATED = 'deprecated',
}

@Entity('contracts')
export class SmartContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  contractId: string; // Stellar/Soroban Contract Address (e.g., C...)

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.UNVERIFIED })
  status: ContractStatus;

  @Column({ nullable: true })
  deprecationNotice: string;

  @OneToMany(() => ContractVersion, (v) => v.contract, { cascade: true })
  versions: ContractVersion[];

  @OneToMany(() => SecurityAudit, (a) => a.contract, { cascade: true })
  audits: SecurityAudit[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}