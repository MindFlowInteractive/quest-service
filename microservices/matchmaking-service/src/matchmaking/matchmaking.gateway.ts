import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { QueueService } from '../queue/queue.service';
import { MatchService } from '../match/match.service';

@WebSocketGateway({ cors: true })
export class MatchmakingGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly queueService: QueueService,
    private readonly matchService: MatchService,
  ) {}

  @SubscribeMessage('joinQueue')
  handleJoinQueue(_, payload) {
    this.queueService.addPlayer({
      ...payload,
      joinedAt: Date.now(),
    });

    this.server.emit('queueUpdate', this.queueService.getQueue());

    const match = this.queueService.findMatch();
    if (match) {
      match.forEach(p => this.queueService.removePlayer(p.id));
      const createdMatch = this.matchService.createMatch(match);
      this.server.emit('matchFound', createdMatch);
    }
  }
}
