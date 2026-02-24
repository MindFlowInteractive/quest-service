import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class NFTOwnership {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  playerId: string;

  @Column()
  tokenId: string;

  @Column('jsonb')
  metadata: any;

  @CreateDateColumn()
  mintedAt: Date;
}
