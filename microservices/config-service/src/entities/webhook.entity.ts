import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('config_webhooks')
@Index(['service', 'environment'])
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  service: string;

  @Column({ length: 50 })
  environment: string;

  @Column()
  url: string;

  @Column({ nullable: true, select: false })
  signingSecret?: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
