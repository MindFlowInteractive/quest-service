import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'sms_templates' })
export class SmsTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: true })
  active: boolean;

  @Column({ default: 1 })
  version: number;

  @Column({ type: 'simple-json', nullable: true })
  variables: string[];

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
