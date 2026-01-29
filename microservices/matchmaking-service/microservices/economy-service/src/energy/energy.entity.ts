import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EnergyType {
  STAMINA = 'stamina',
  ENERGY = 'energy',
}

@Entity('user_energy')
export class UserEnergy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: EnergyType,
    default: EnergyType.ENERGY,
  })
  energyType: EnergyType;

  @Column({ default: 100 })
  currentAmount: number;

  @Column({ default: 100 })
  maxAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRegenerationTime: Date;

  @Column({ default: 300 })
  regenerationRate: number;

  @Column({ default: 60 })
  regenerationInterval: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
