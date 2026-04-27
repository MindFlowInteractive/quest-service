import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FlagType {
  SUSPICIOUS = 'suspicious',
  CHEATING = 'cheating',
  MULTI_ACCOUNT = 'multi_account',
  PAYMENT_FRAUD = 'payment_fraud',
  BOT = 'bot',
  ABUSIVE = 'abusive',
}

export enum FlagStatus {
  ACTIVE = 'active',
  LIFTED = 'lifted',
  PERMANENT = 'permanent',
}

export enum AccountSuspensionStatus {
  NONE = 'none',
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
}

@Entity('account_flags')
@Index(['playerId'])
@Index(['flagStatus'])
@Index(['suspensionStatus'])
export class AccountFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  playerId: string;

  @Column({ type: 'enum', enum: FlagType, array: true, default: [] })
  flags: FlagType[];

  @Column({ type: 'enum', enum: FlagStatus, default: FlagStatus.ACTIVE })
  flagStatus: FlagStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  currentRiskScore: number;

  @Column({
    type: 'enum',
    enum: AccountSuspensionStatus,
    default: AccountSuspensionStatus.NONE,
  })
  suspensionStatus: AccountSuspensionStatus;

  @Column({ type: 'timestamp', nullable: true })
  suspendedUntil?: Date;

  @Column({ type: 'text', nullable: true })
  suspensionReason?: string;

  @Column({ type: 'uuid', nullable: true })
  actionTakenBy?: string;

  @Column({ type: 'int', default: 0 })
  flagCount: number;

  @Column({ type: 'jsonb', default: {} })
  history: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
