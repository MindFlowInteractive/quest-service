import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { GuildMember } from './guild-member.entity';

@Entity('guilds')
@Index(['tag'], { unique: true })
export class Guild {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 4, unique: true })
  tag: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid' })
  @Index()
  ownerId: string;

  @Column({ type: 'int', default: 20 })
  maxMembers: number;

  @Column({ type: 'int', default: 0 })
  @Index()
  aggregateScore: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  lastScoreUpdateAt?: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => GuildMember, (member) => member.guild, { cascade: true })
  members: GuildMember[];
}
