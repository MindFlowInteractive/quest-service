import { Player } from 'src/player/entities/player.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  questId: string;

  @Column()
  status: string;

  @ManyToOne(() => Player)
  player: Player;
}
