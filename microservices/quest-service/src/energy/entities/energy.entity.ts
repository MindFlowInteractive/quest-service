import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';

@Entity('user_energy')
export class UserEnergy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: 100 })
  currentEnergy: number;

  @Column({ default: 100 })
  maxEnergy: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastRegenerationAt: Date;

  @Column({ default: 300 }) // Seconds per energy point (e.g., 5 minutes)
  regenerationRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
