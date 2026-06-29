import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Player } from './player.entity';

@Entity('player_profiles')
export class PlayerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Player, (player) => player.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  player: Player;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  totalScore: number;

  @Column({ type: 'int', default: 0 })
  gamesPlayed: number;

  @Column({ type: 'int', default: 0 })
  puzzlesSolved: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}