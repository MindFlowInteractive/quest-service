import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Message } from './message.entity';

@Entity({ name: 'sms_senders' })
@Index(['provider', 'fromNumber'])
export class Sms {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  provider: string;

  @Column()
  fromNumber: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
