import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum BadgeRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

@Entity('badges')
export class BadgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  skill: string;

  @Column({
    type: 'enum',
    enum: BadgeRarity,
    default: BadgeRarity.COMMON,
  })
  rarity: BadgeRarity;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}