import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum EnergyBoostType {
  REGENERATION_SPEED = 'regeneration_speed',
  MAX_ENERGY_INCREASE = 'max_energy_increase',
  CONSUMPTION_REDUCTION = 'consumption_reduction',
  INSTANT_REFILL = 'instant_refill',
}

@Entity('energy_boosts')
@Index(['isActive'])
@Index(['boostType'])
export class EnergyBoost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({
    name: 'boost_type',
    type: 'enum',
    enum: EnergyBoostType,
  })
  boostType: EnergyBoostType;

  @Column({ name: 'effect_value', type: 'decimal', precision: 5, scale: 2 })
  effectValue: number; // Multiplier or flat amount depending on type

  @Column({ name: 'duration_minutes', type: 'integer', nullable: true })
  durationMinutes: number | null; // null for permanent boosts

  @Column({ name: 'token_cost', type: 'integer', default: 0 })
  tokenCost: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'icon_url', type: 'varchar', length: 255, nullable: true })
  iconUrl: string | null;

  @Column({ name: 'rarity', type: 'varchar', length: 20, default: 'common' })
  rarity: string; // common, rare, epic, legendary

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}