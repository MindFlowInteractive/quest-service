import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

/**
 * Replace this implementation with the repository's existing JWT/session
 * authentication. The gateway must derive the user ID from a verified
 * credential and must never trust an arbitrary client-supplied userId.
 */
@Injectable()
export class NotificationSocketAuth {
  authenticate(client: Socket): string | null {
    // Development scaffold only.
    // Production: verify client.handshake.auth.token and return the
    // authenticated subject/user ID.
    const userId = client.handshake.auth?.userId;

    return typeof userId === 'string' && userId.length > 0 ? userId : null;
  }
}
