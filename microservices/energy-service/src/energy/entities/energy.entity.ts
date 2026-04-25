import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TransactionType {
  CONSUME = 'consume',
  REFILL = 'refill',
  REGEN = 'regen',
}

export enum RefillType {
  TOKEN = 'token',
  TIME = 'time',
  REWARD = 'reward',
}

@Entity('energy_accounts')
export class EnergyAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ type: 'int', default: 100 })
  currentEnergy: number;

  @Column({ type: 'int', default: 100 })
  maxEnergy: number;

  @Column({ type: 'int', default: 1 })
  regenRatePerMinute: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRegenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('energy_transactions')
export class EnergyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'int' })
  balanceBefore: number;

  @Column({ type: 'int' })
  balanceAfter: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('energy_refills')
export class EnergyRefill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({
    type: 'enum',
    enum: RefillType,
    default: RefillType.TOKEN,
  })
  refillType: RefillType;

  @Column({ nullable: true })
  tokenCost: number;

  @Column({ default: false })
  applied: boolean;

  @CreateDateColumn()
  createdAt: Date;
}