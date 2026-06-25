import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { SmartContract } from './contract.entity';

@Entity('contract_versions')
export class ContractVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  versionStr: string; // e.g., "1.0.0"

  @Column()
  wasmHash: string; // SHA256 hash of compiled WASM payload

  @Column({ nullable: true })
  sourceCodeUrl: string; // Reference link to verified GitHub commit

  @Column({ default: false })
  isVerified: boolean;

  @ManyToOne(() => SmartContract, (c) => c.versions)
  contract: SmartContract;

  @CreateDateColumn()
  createdAt: Date;
}