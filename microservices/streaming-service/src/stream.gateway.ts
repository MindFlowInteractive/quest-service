import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';

@WebSocketGateway({ namespace: '/stream' })
export class StreamingGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('chat')
  handleChat(@MessageBody() message: { channelId: string; viewerId: string; text: string }) {
    this.server.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({ event: 'chat', data: message }));
      }
    });
    return { status: 'broadcasted', message };
  }
}
