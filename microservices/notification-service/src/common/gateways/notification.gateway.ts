import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';

@WebSocketGateway({
    path: '/notifications',
})
export class NotificationGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationGateway.name);
    private clients = new Map<string, WebSocket>();

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
    }

    handleConnection(client: WebSocket, ...args: any[]) {
        // In a real app, we would authenticate and get the userId from the token
        // For now, let's assume we get it from a query param or similar for demo
        this.logger.log('Client connected');
    }

    handleDisconnect(client: WebSocket) {
        this.logger.log('Client disconnected');
        // Remove from clients map
        for (const [userId, socket] of this.clients.entries()) {
            if (socket === client) {
                this.clients.delete(userId);
                break;
            }
        }
    }

    @SubscribeMessage('authenticate')
    handleAuthenticate(client: WebSocket, payload: { userId: string }) {
        this.logger.log(`Authenticating user: ${payload.userId}`);
        this.clients.set(payload.userId, client);
        return { status: 'authenticated' };
    }

    sendToUser(userId: string, data: any) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
            return true;
        }
        return false;
    }

    broadcast(data: any) {
        this.server.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
}
