import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class WalletUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  walletAddress: string;

  @Column({ nullable: true })
  userId: string; // link to internal user account

  @CreateDateColumn()
  createdAt: Date;
}
