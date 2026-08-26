import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { Notification } from '../entities/notification.entity';
import { NotificationAckDto } from '../dto/notification-ack.dto';
import { NotificationDeliveryService } from '../services/notification-delivery.service';
import { NotificationSocketAuth } from '../auth/notification-socket-auth';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') ?? '*',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly connections = new Map<string, Set<string>>();

  constructor(
    private readonly auth: NotificationSocketAuth,
    private readonly deliveryService: NotificationDeliveryService,
  ) {}

  handleConnection(client: Socket): void {
    const userId = this.auth.authenticate(client);

    if (!userId) {
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    client.join(this.userRoom(userId));

    const sockets = this.connections.get(userId) ?? new Set<string>();
    sockets.add(client.id);
    this.connections.set(userId, sockets);
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data.userId as string | undefined;

    if (!userId) {
      return;
    }

    const sockets = this.connections.get(userId);

    if (!sockets) {
      return;
    }

    sockets.delete(client.id);

    if (sockets.size === 0) {
      this.connections.delete(userId);
    }
  }

  isUserOnline(userId: string): boolean {
    return this.connections.has(userId);
  }

  sendToUser(userId: string, notification: Notification): boolean {
    if (!this.isUserOnline(userId)) {
      return false;
    }

    this.server
      .to(this.userRoom(userId))
      .emit('notification', this.serialize(notification));

    return true;
  }

  @SubscribeMessage('notification:ack')
  async acknowledge(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: NotificationAckDto,
  ) {
    const userId = client.data.userId as string;

    return this.deliveryService.acknowledge(payload.notificationId, userId);
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private serialize(notification: Notification) {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      status: notification.status,
      createdAt: notification.createdAt,
    };
  }
}
