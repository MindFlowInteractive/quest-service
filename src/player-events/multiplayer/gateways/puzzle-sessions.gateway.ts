import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PuzzleSessionService } from '../services/puzzle-session.service';
import { JoinPuzzleSessionDto } from '../dto/join-puzzle-session.dto';
import { SubmitSolutionDto } from '../dto/submit-solution.dto';
import { UpdatePartialSolutionDto } from '../dto/update-solution.dto';

@WebSocketGateway({
  namespace: '/puzzle-sessions',
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') ?? '*',
    credentials: true,
  },
  transports: ['websocket'],
})
export class PuzzleSessionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly sessionService: PuzzleSessionService) {}

  async handleConnection(client: Socket) {
    const userId = this.resolveUserId(client);
    if (!userId) {
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    const sessionId = client.data.sessionId as string | undefined;
    if (!userId || !sessionId) return;

    try {
      const state = await this.sessionService.disconnect(sessionId, userId);
      this.server.to(this.room(sessionId)).emit('session:player-left', {
        userId,
        reason: 'disconnect',
        state,
      });
    } catch {
      // The session may already have expired or been removed.
    }
  }

  @SubscribeMessage('session:join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinPuzzleSessionDto,
  ) {
    const userId = this.requireUser(client);

    try {
      const state = await this.sessionService.join(dto.sessionId, userId);
      client.data.sessionId = dto.sessionId;
      await client.join(this.room(dto.sessionId));

      this.server.to(this.room(dto.sessionId)).emit('session:player-joined', {
        userId,
        state,
      });

      return { event: 'session:state', data: state };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('session:leave')
  async leave(@ConnectedSocket() client: Socket) {
    const userId = this.requireUser(client);
    const sessionId = client.data.sessionId as string;
    if (!sessionId) throw new WsException('Not joined to a session');

    try {
      const state = await this.sessionService.leave(sessionId, userId);
      client.leave(this.room(sessionId));
      client.data.sessionId = undefined;

      this.server.to(this.room(sessionId)).emit('session:player-left', {
        userId,
        state,
      });

      return { event: 'session:state', data: state };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('puzzle:update-partial-solution')
  async partial(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: UpdatePartialSolutionDto,
  ) {
    const userId = this.requireUser(client);
    try {
      const state = await this.sessionService.updatePartialSolution(dto, userId);
      this.server.to(this.room(dto.sessionId)).emit(
        'puzzle:solution-updated',
        { userId, state },
      );
      return { event: 'puzzle:solution-updated', data: state };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('puzzle:submit-solution')
  async submit(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SubmitSolutionDto,
  ) {
    const userId = this.requireUser(client);
    try {
      const result = await this.sessionService.submitSolution(dto, userId);

      this.server.to(this.room(dto.sessionId)).emit(
        'puzzle:state',
        result,
      );

      return { event: 'puzzle:state', data: result };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('session:sync')
  async sync(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinPuzzleSessionDto,
  ) {
    const userId = this.requireUser(client);
    const state = await this.sessionService.getState(dto.sessionId);

    if (!state.players[userId]) {
      throw new WsException('Player is not part of this session');
    }

    return { event: 'session:state', data: state };
  }

  private room(sessionId: string) {
    return `puzzle-session:${sessionId}`;
  }

  private requireUser(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) throw new WsException('Unauthenticated socket');
    return userId;
  }

  private resolveUserId(client: Socket): string | undefined {
    // Replace this with the repository's verified JWT/session authentication.
    // Never trust an arbitrary userId sent by an untrusted client in production.
    return (
      (client.handshake.auth?.userId as string | undefined) ??
      (client.handshake.query?.userId as string | undefined)
    );
  }

  private toWsException(error: any) {
    if (error instanceof WsException) return error;
    return new WsException(error?.response ?? error?.message ?? 'Request failed');
  }
}
