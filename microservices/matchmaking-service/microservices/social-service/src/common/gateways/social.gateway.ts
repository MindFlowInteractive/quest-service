import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'ws';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket'],
})
export class SocialGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger('SocialGateway');
  private userConnections = new Map<string, Socket>();

  afterInit(server: Server) {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.url}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.url}`);
    // Clean up user connections
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      this.userConnections.delete(userId);
      this.broadcastUserStatus(userId, 'offline');
    }
  }

  /**
   * Subscribe to room updates
   * Event: room-join
   */
  @SubscribeMessage('room-join')
  handleRoomJoin(
    client: Socket,
    payload: { roomId: string; userId: string },
  ) {
    const { roomId, userId } = payload;
    this.logger.log(`User ${userId} joined room ${roomId}`);

    // Store user connection
    this.userConnections.set(userId, client);

    // Broadcast room update
    this.server.clients.forEach((c) => {
      if (c.readyState === 1) {
        // OPEN
        c.send(
          JSON.stringify({
            event: 'room-user-joined',
            data: { roomId, userId },
          }),
        );
      }
    });
  }

  /**
   * Subscribe to room leave
   * Event: room-leave
   */
  @SubscribeMessage('room-leave')
  handleRoomLeave(
    client: Socket,
    payload: { roomId: string; userId: string },
  ) {
    const { roomId, userId } = payload;
    this.logger.log(`User ${userId} left room ${roomId}`);

    // Broadcast room update
    this.server.clients.forEach((c) => {
      if (c.readyState === 1) {
        c.send(
          JSON.stringify({
            event: 'room-user-left',
            data: { roomId, userId },
          }),
        );
      }
    });
  }

  /**
   * Send room message
   * Event: room-message
   */
  @SubscribeMessage('room-message')
  handleRoomMessage(
    client: Socket,
    payload: { roomId: string; userId: string; message: string },
  ) {
    const { roomId, userId, message } = payload;
    this.logger.log(`Message in room ${roomId} from ${userId}: ${message}`);

    // Broadcast message to all connected clients
    this.server.clients.forEach((c) => {
      if (c.readyState === 1) {
        c.send(
          JSON.stringify({
            event: 'room-message',
            data: { roomId, userId, message, timestamp: new Date() },
          }),
        );
      }
    });
  }

  /**
   * Subscribe to game start
   * Event: game-start
   */
  @SubscribeMessage('game-start')
  handleGameStart(
    client: Socket,
    payload: { roomId: string; userId: string },
  ) {
    const { roomId, userId } = payload;
    this.logger.log(`Game started in room ${roomId} by ${userId}`);

    // Broadcast game start
    this.server.clients.forEach((c) => {
      if (c.readyState === 1) {
        c.send(
          JSON.stringify({
            event: 'game-started',
            data: { roomId, startedBy: userId, startedAt: new Date() },
          }),
        );
      }
    });
  }

  /**
   * Subscribe to game complete
   * Event: game-complete
   */
  @SubscribeMessage('game-complete')
  handleGameComplete(
    client: Socket,
    payload: {
      roomId: string;
      userId: string;
      results: Record<string, any>;
    },
  ) {
    const { roomId, userId, results } = payload;
    this.logger.log(`Game completed in room ${roomId}`);

    // Broadcast game results
    this.server.clients.forEach((c) => {
      if (c.readyState === 1) {
        c.send(
          JSON.stringify({
            event: 'game-completed',
            data: { roomId, completedBy: userId, results, completedAt: new Date() },
          }),
        );
      }
    });
  }

  /**
   * Subscribe to leaderboard updates
   * Event: leaderboard-update
   */
  @SubscribeMessage('leaderboard-update')
  handleLeaderboardUpdate(
    client: Socket,
    payload: { userId: string; score: number; rank: number; seasonId: string },
  ) {
    const { userId, score, rank, seasonId } = payload;
    this.logger.log(`Leaderboard updated for user ${userId}: score=${score}, rank=${rank}`);

    // Broadcast leaderboard update
    this.server.clients.forEach((c) => {
      if (c.readyState === 1) {
        c.send(
          JSON.stringify({
            event: 'leaderboard-updated',
            data: { userId, score, rank, seasonId, updatedAt: new Date() },
          }),
        );
      }
    });
  }

  /**
   * Subscribe to friend status
   * Event: friend-status
   */
  @SubscribeMessage('friend-status')
  handleFriendStatus(
    client: Socket,
    payload: { userId: string; status: 'online' | 'offline' | 'in-game' },
  ) {
    const { userId, status } = payload;
    this.logger.log(`Friend status update for ${userId}: ${status}`);

    // Store connection
    if (status === 'online') {
      this.userConnections.set(userId, client);
    }

    // Broadcast friend status
    this.broadcastUserStatus(userId, status);
  }

  /**
   * Subscribe to friend request notification
   * Event: friend-request-notification
   */
  @SubscribeMessage('friend-request')
  handleFriendRequest(
    client: Socket,
    payload: { fromUserId: string; toUserId: string; requestId: string },
  ) {
    const { fromUserId, toUserId, requestId } = payload;
    this.logger.log(`Friend request from ${fromUserId} to ${toUserId}`);

    // Send notification to specific user if connected
    const targetSocket = this.userConnections.get(toUserId);
    if (targetSocket && targetSocket.readyState === 1) {
      targetSocket.send(
        JSON.stringify({
          event: 'friend-request-received',
          data: { fromUserId, requestId, receivedAt: new Date() },
        }),
      );
    }
  }

  /**
   * Subscribe to friend request response
   * Event: friend-request-response
   */
  @SubscribeMessage('friend-request-response')
  handleFriendRequestResponse(
    client: Socket,
    payload: { userId: string; requestId: string; accepted: boolean },
  ) {
    const { userId, requestId, accepted } = payload;
    this.logger.log(
      `Friend request response from ${userId}: ${accepted ? 'accepted' : 'declined'}`,
    );

    // Broadcast response
    this.server.clients.forEach((c) => {
      if (c.readyState === 1) {
        c.send(
          JSON.stringify({
            event: 'friend-request-responded',
            data: { userId, requestId, accepted, respondedAt: new Date() },
          }),
        );
      }
    });
  }

  /**
   * Subscribe to room invitation
   * Event: room-invite
   */
  @SubscribeMessage('room-invite')
  handleRoomInvite(
    client: Socket,
    payload: { fromUserId: string; toUserId: string; roomId: string },
  ) {
    const { fromUserId, toUserId, roomId } = payload;
    this.logger.log(`Room invite from ${fromUserId} to ${toUserId} for room ${roomId}`);

    // Send invitation to specific user if connected
    const targetSocket = this.userConnections.get(toUserId);
    if (targetSocket && targetSocket.readyState === 1) {
      targetSocket.send(
        JSON.stringify({
          event: 'room-invite-received',
          data: { fromUserId, roomId, invitedAt: new Date() },
        }),
      );
    }
  }

  /**
   * Subscribe to typing indicator
   * Event: typing-indicator
   */
  @SubscribeMessage('typing-indicator')
  handleTypingIndicator(
    client: Socket,
    payload: { roomId: string; userId: string; isTyping: boolean },
  ) {
    const { roomId, userId, isTyping } = payload;

    // Broadcast typing status
    this.server.clients.forEach((c) => {
      if (c.readyState === 1) {
        c.send(
          JSON.stringify({
            event: 'user-typing',
            data: { roomId, userId, isTyping },
          }),
        );
      }
    });
  }

  /**
   * Broadcast user status to all connected clients
   */
  private broadcastUserStatus(
    userId: string,
    status: 'online' | 'offline' | 'in-game',
  ) {
    this.server.clients.forEach((c) => {
      if (c.readyState === 1) {
        c.send(
          JSON.stringify({
            event: 'user-status-changed',
            data: { userId, status, changedAt: new Date() },
          }),
        );
      }
    });
  }

  /**
   * Get user ID from socket (in real implementation, extract from JWT token)
   */
  private getUserIdFromSocket(socket: Socket): string | null {
    // TODO: Extract user ID from socket authentication/headers
    return null;
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    const socket = this.userConnections.get(userId);
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({ event, data }));
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userConnections.size;
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUsers(): string[] {
    return Array.from(this.userConnections.keys());
  }
}
