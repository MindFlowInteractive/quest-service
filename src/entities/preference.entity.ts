import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  // Storing dynamic matrices (e.g., favorite_vault_types, activity_level, UI_theme)
  @Column({ type: 'jsonb', default: {} })
  behavioralProfile: Record<string, any>;

  // Calculated affinity scores used for ML matching loops
  @Column({ type: 'jsonb', default: {} })
  categoryAffinities: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}