import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TemplateCategory {
  WELCOME = 'welcome',
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password_reset',
  ACHIEVEMENT = 'achievement',
  QUEST_COMPLETED = 'quest_completed',
  FRIEND_REQUEST = 'friend_request',
  NEWSLETTER = 'newsletter',
  MARKETING = 'marketing',
  SYSTEM = 'system',
  CUSTOM = 'custom',
}

@Entity({ name: 'email_templates' })
@Index(['name'], { unique: true })
@Index(['category', 'isActive'])
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  htmlBody: string;

  @Column({ type: 'text', nullable: true })
  textBody: string;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.CUSTOM,
  })
  category: TemplateCategory;

  @Column({ type: 'jsonb', nullable: true })
  defaultVariables: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  requiredVariables: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 1 })
  version: number;

  @Column({ nullable: true })
  previewText: string;

  @Column({ nullable: true })
  fromEmail: string;

  @Column({ nullable: true })
  fromName: string;

  @Column({ nullable: true })
  replyTo: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
