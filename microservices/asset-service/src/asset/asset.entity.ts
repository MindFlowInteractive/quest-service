import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum AssetStatus {
  ACTIVE = 'active',
  ESCROWED_LISTING = 'escrowed_listing',
  ESCROWED_TRADING = 'escrowed_trading',
  TRANSFERRED = 'transferred',
  DISPUTED = 'disputed',
  FROZEN = 'frozen',
}

export enum AssetType {
  ITEM = 'item',
  ACHIEVEMENT = 'achievement',
  CURRENCY = 'currency',
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  ownerId: string;

  @Column()
  filename: string;

  @Column()
  mimeType: string;

  @Column( { type: 'bigint', default: 0 })
  sizeBytes: number;

  @Column({ type: 'varchar', default: AssetStatus.ACTIVE })
  status: AssetStatus;

  @Index()
  @Column({ type: 'varchar', default: AssetType.ITEM })
  type: AssetType;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  displayName: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  rarity: string | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  isTradeable: boolean;

  @Column({ type: 'bigint', nullable: true, transformer: { to: (v: number | null) => v, from: (v: string | null) => (v === null ? null : Number(v)) } })
  listingPrice: number | null;

  @Column({ type: 'varchar', nullable: true })
  currency: string | null;

  @Column({ type: 'varchar', nullable: true })
  escrowId: string | null;

  @Column({ type: 'varchar', nullable: true })
  storageKey: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
