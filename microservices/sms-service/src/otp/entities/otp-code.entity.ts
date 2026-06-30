import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'otp_codes' })
@Index(['normalizedPhoneNumber', 'purpose', 'createdAt'])
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phoneNumber: string;

  @Column()
  normalizedPhoneNumber: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  purpose: string;

  @Column()
  codeHash: string;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: 5 })
  maxAttempts: number;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  lastAttemptAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
