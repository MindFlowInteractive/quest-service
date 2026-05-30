import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('loyalty_points')
export class LoyaltyPoints {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ default: 0 })
  points: number;

  @Column({ default: 'bronze' })
  tier: string;

  @UpdateDateColumn()
  updatedAt: Date;
}