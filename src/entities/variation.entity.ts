import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ab_variations')
export class AbVariation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  experimentName: string; // e.g., "vault_pricing_tier_v2"

  @Column()
  variantKey: string; // e.g., "control", "variant_a", "variant_b"

  @Column({ type: 'jsonb' })
  configurationPayload: Record<string, any>; // Specific layout structure updates

  @Column({ default: 0 })
  impressions: number;

  @Column({ default: 0 })
  conversions: number;

  @CreateDateColumn()
  createdAt: Date;
}