import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UseGuards, OnModuleInit, Inject } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { WsJwtAuthGuard } from '../auth/ws-jwt-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseGuards(WsJwtAuthGuard)
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer() server: Server;
  @Inject('REDIS_PUB_CLIENT') private readonly pubClient: any;
  @Inject('REDIS_SUB_CLIENT') private readonly subClient: any;

  async onModuleInit() {
    this.server.adapter(createAdapter(this.pubClient, this.subClient));
  }
  private logger: Logger = new Logger('WebsocketGateway');
  private connectedClients: Map<string, Socket> = new Map();
  private rooms: Map<string, Set<string>> = new Map(); // roomId -> Set of clientIds
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of clientIds
  private onlineUsers: Set<string> = new Set(); // userIds that are online
  private messageQueue: Map<string, any[]> = new Map(); // userId -> queued messages
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map(); // clientId -> rate limit

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
    const userId = client.data.user?.sub;
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
        this.onlineUsers.add(userId);
        // Emit user online
        this.broadcastPresence(userId, 'online');
        // Send queued messages
        const queued = this.messageQueue.get(userId) || [];
        queued.forEach((message) => {
          client.emit('queued-message', message);
        });
        this.messageQueue.delete(userId);
      }
      this.userSockets.get(userId)!.add(client.id);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
    const userId = client.data.user?.sub;
    if (userId) {
      const userClients = this.userSockets.get(userId);
      if (userClients) {
        userClients.delete(client.id);
        if (userClients.size === 0) {
          this.userSockets.delete(userId);
          this.onlineUsers.delete(userId);
          // Emit user offline
          this.broadcastPresence(userId, 'offline');
        }
      }
    }
    // Remove from rooms
    for (const [roomId, clients] of this.rooms.entries()) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  private broadcastPresence(userId: string, status: 'online' | 'offline') {
    // Broadcast to all connected clients, or perhaps to friends, but for now all
    this.connectedClients.forEach((client) => {
      client.emit('presence', { userId, status, timestamp: new Date().toISOString() });
    });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    client.join(roomId);
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(client.id);
    this.logger.log(`Client ${client.id} joined room ${roomId}`);
    return { event: 'joined-room', data: { roomId } };
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    client.leave(roomId);
    const roomClients = this.rooms.get(roomId);
    if (roomClients) {
      roomClients.delete(client.id);
      if (roomClients.size === 0) {
        this.rooms.delete(roomId);
      }
    }
    this.logger.log(`Client ${client.id} left room ${roomId}`);
    return { event: 'left-room', data: { roomId } };
  }

  private checkRateLimit(clientId: string, limit: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const limitData = this.rateLimits.get(clientId);
    if (!limitData || now > limitData.resetTime) {
      this.rateLimits.set(clientId, { count: 1, resetTime: now + windowMs });
      return true;
    }
    if (limitData.count >= limit) {
      return false;
    }
    limitData.count++;
    return true;
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { roomId?: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.checkRateLimit(client.id)) {
      client.emit('error', { message: 'Rate limit exceeded' });
      return;
    }
    const { roomId, message } = data;
    if (roomId) {
      // Broadcast to room
      client.to(roomId).emit('message', {
        from: client.data.user?.sub,
        message,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Echo back
      return { event: 'message', data: { message: `Echo: ${message}` } };
    }
  }

  // Method to broadcast to room from outside
  broadcastToRoom(roomId: string, event: string, data: any) {
    this.connectedClients.forEach((client) => {
      if (this.rooms.get(roomId)?.has(client.id)) {
        client.emit(event, data);
      }
    });
  }

  // Send message to specific user
  sendToUser(userId: string, event: string, data: any) {
    if (this.onlineUsers.has(userId)) {
      // Send immediately
      const userClients = this.userSockets.get(userId);
      userClients?.forEach((clientId) => {
        const client = this.connectedClients.get(clientId);
        if (client) {
          client.emit(event, data);
        }
      });
    } else {
      // Queue for later
      if (!this.messageQueue.has(userId)) {
        this.messageQueue.set(userId, []);
      }
      this.messageQueue.get(userId)!.push({ event, data, timestamp: new Date().toISOString() });
    }
  }
}
