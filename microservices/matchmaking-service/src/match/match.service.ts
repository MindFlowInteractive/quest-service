import { Injectable } from '@nestjs/common';
import { Player } from '../player/player.interface';

@Injectable()
export class MatchService {
  createMatch(players: [Player, Player]) {
    return {
      id: `match_${Date.now()}`,
      players,
      createdAt: new Date(),
    };
  }
}
