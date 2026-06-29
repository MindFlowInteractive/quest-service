import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Guild } from './guild.entity';

export type GuildRole = 'owner' | 'officer' | 'member';

@Entity('guild_members')
@Unique(['guildId', 'playerId'])
export class GuildMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  guildId: string;

  @Column({ type: 'uuid' })
  @Index()
  playerId: string;

  @Column({
    type: 'enum',
    enum: ['owner', 'officer', 'member'],
    default: 'member',
  })
  @Index()
  role: GuildRole;

  @CreateDateColumn()
  @Index()
  joinedAt: Date;

  @ManyToOne(() => Guild, (guild) => guild.members, { onDelete: 'CASCADE' })
  guild: Guild;
}
