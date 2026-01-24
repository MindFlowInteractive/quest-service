import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum BoostType {
  REGEN_SPEED = 'REGEN_SPEED',
  EXTRA_CAPACITY = 'EXTRA_CAPACITY',
  UNLIMITED = 'UNLIMITED',
}

@Entity('energy_boosts')
export class EnergyBoost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: BoostType,
  })
  type: BoostType;

  @Column({ type: 'float', default: 1.0 })
  multiplier: number;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
