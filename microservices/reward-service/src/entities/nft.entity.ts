import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('nfts')
@Index(['ownerId', 'tokenId'])
@Index(['contractId', 'tokenId'], { unique: true })
export class NFT {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  @Index()
  tokenId: number;

  @Column({ type: 'uuid' })
  @Index()
  ownerId: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  contractId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 500 })
  imageUrl: string;

  @Column({ type: 'varchar', length: 1000 })
  metadataUri: string;

  @Column({ type: 'jsonb', default: {} })
  attributes: {
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    category?: string;
    traits?: Record<string, any>;
    [key: string]: any;
  };

  @Column({ type: 'varchar', length: 50, default: 'active' })
  @Index()
  status: 'active' | 'transferred' | 'burned' | 'listed' | 'failed';

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  mintedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  transferredAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionHash?: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    collectionName?: string;
    artist?: string;
    year?: number;
    edition?: number;
    totalEditions?: number;
    [key: string]: any;
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}