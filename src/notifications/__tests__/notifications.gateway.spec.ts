import { NotificationsGateway } from '../gateways/notifications.gateway';

describe('NotificationsGateway', () => {
  const auth = {
    authenticate: jest.fn(),
  };

  const delivery = {
    acknowledge: jest.fn(),
  };

  let gateway: NotificationsGateway;

  beforeEach(() => {
    gateway = new NotificationsGateway(
      auth as any,
      delivery as any,
    );

    (gateway as any).server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
  });

  it('tracks connected users', () => {
    auth.authenticate.mockReturnValue('u1');

    gateway.handleConnection({
      id: 'socket-1',
      handshake: {},
      data: {},
      join: jest.fn(),
    } as any);

    expect(gateway.isUserOnline('u1')).toBe(true);
  });

  it('removes users after their last socket disconnects', () => {
    auth.authenticate.mockReturnValue('u1');

    const client: any = {
      id: 'socket-1',
      handshake: {},
      data: {},
      join: jest.fn(),
      disconnect: jest.fn(),
    };

    gateway.handleConnection(client);
    gateway.handleDisconnect(client);

    expect(gateway.isUserOnline('u1')).toBe(false);
  });

  it('does not deliver to offline users', () => {
    const result = gateway.sendToUser('missing', {} as any);

    expect(result).toBe(false);
  });
});
