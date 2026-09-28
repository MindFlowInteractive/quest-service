import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { LiveStreamingService } from '../live-streaming.service';

interface JoinPayload {
  streamId: string;
  userId: string;
  username?: string;
  bandwidthKbps?: number;
}

interface ChatPayload {
  streamId: string;
  userId: string;
  content: string;
}

interface QualityPayload {
  streamId: string;
  userId: string;
  bandwidthKbps: number;
}

/** Per-socket state set on join, read back on disconnect. */
interface StreamSocketData {
  userId?: string;
  streamId?: string;
}

/**
 * Real-time spectator transport. Chat is delivered by room broadcast so every
 * spectator in `stream:<id>` receives it in the same tick; viewer counts are
 * re-read from the service (the roster, not a local counter) so two sockets
 * cannot drift the number.
 */
@WebSocketGateway({
  namespace: '/streams',
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') ?? '*',
    credentials: true,
  },
})
export class LiveStreamingGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly memberships = new Map<string, Set<string>>();

  constructor(private readonly service: LiveStreamingService) {}

  @SubscribeMessage('stream:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ) {
    await this.service.joinStream(payload.streamId, payload.userId, {
      username: payload.username,
      bandwidthKbps: payload.bandwidthKbps,
    });

    const room = this.room(payload.streamId);
    await client.join(room);
    const data = client.data as StreamSocketData;
    data.userId = payload.userId;
    data.streamId = payload.streamId;
    this.track(room, client.id);

    const count = await this.service.getViewerCount(payload.streamId);
    this.server
      .to(room)
      .emit('stream:viewers', { streamId: payload.streamId, count });
    return { joined: true, count };
  }

  @SubscribeMessage('stream:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { streamId: string; userId: string },
  ) {
    await this.service.leaveStream(payload.streamId, payload.userId);
    const room = this.room(payload.streamId);
    await client.leave(room);
    this.memberships.get(room)?.delete(client.id);

    const count = await this.service.getViewerCount(payload.streamId);
    this.server
      .to(room)
      .emit('stream:viewers', { streamId: payload.streamId, count });
    return { left: true, count };
  }

  @SubscribeMessage('stream:chat')
  async handleChat(@MessageBody() payload: ChatPayload) {
    const message = await this.service.postMessage(
      payload.streamId,
      payload.userId,
      payload.content,
    );
    this.server.to(this.room(payload.streamId)).emit('stream:chat', message);
    return message;
  }

  @SubscribeMessage('stream:quality')
  async handleQuality(@MessageBody() payload: QualityPayload) {
    return this.service.selectQuality(
      payload.streamId,
      payload.userId,
      payload.bandwidthKbps,
    );
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const data = client.data as StreamSocketData;
    const streamId = data.streamId;
    const userId = data.userId;

    if (streamId && userId) {
      try {
        await this.service.leaveStream(streamId, userId);
      } catch {
        // Already left, banned, or the socket never completed a join; the
        // count below is re-read from the roster either way.
      }
    }

    for (const [room, members] of this.memberships.entries()) {
      if (!members.delete(client.id)) {
        continue;
      }
      const id = room.replace('stream:', '');
      const count = await this.service.getViewerCount(id);
      this.server.to(room).emit('stream:viewers', { streamId: id, count });
    }
  }

  private room(streamId: string): string {
    return `stream:${streamId}`;
  }

  private track(room: string, clientId: string): void {
    const members = this.memberships.get(room) ?? new Set<string>();
    members.add(clientId);
    this.memberships.set(room, members);
  }
}
