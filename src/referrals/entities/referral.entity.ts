import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ReferralCode } from './referral-code.entity';

export enum ReferralStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REWARDED = 'rewarded',
  CANCELLED = 'cancelled',
}

@Entity('referrals')
@Index(['referrerId', 'refereeId'], { unique: true })
@Index(['referralCodeId'])
@Index(['refereeId'])
@Index(['status'])
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  referrerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referrerId' })
  referrer: User;

  @Column({ type: 'uuid' })
  @Index()
  refereeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'refereeId' })
  referee: User;

  @Column({ type: 'uuid' })
  referralCodeId: string;

  @ManyToOne(() => ReferralCode)
  @JoinColumn({ name: 'referralCodeId' })
  referralCode: ReferralCode;

  @Column({
    type: 'varchar',
    length: 20,
    default: ReferralStatus.PENDING,
  })
  @Index()
  status: ReferralStatus;

  @Column({ type: 'int', default: 0 })
  referrerReward: number;

  @Column({ type: 'int', default: 0 })
  refereeReward: number;

  @Column({ type: 'boolean', default: false })
  referrerRewarded: boolean;

  @Column({ type: 'boolean', default: false })
  refereeRewarded: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  referrerRewardedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  refereeRewardedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    registrationIp?: string;
    userAgent?: string;
    source?: string;
    campaign?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
