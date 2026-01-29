import { Player } from './player.entity';

export class Match {
  id: string;
  players: Player[];
  createdAt: number;
}
