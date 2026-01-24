import { Player } from 'src/player/entities/player.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @OneToOne(() => Player)
  @JoinColumn()
  player: Player;
}
