import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MatchmakingService } from '../matchmaking.service';

@WebSocketGateway({ cors: true })
export class MatchmakingGateway {
  @WebSocketServer()
  server: Server;

  constructor(private matchmaking: MatchmakingService) {}

  @SubscribeMessage('joinQueue')
  handleJoin(@MessageBody() player: any) {
    const match = this.matchmaking.joinQueue(player);

    this.server.emit('queueUpdate');

    if (match) {
      this.server.emit('matchFound', match);
    }
  }
}
