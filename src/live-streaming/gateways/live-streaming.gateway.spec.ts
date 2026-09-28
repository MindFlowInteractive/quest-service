import { LiveStreamingGateway } from './live-streaming.gateway';

describe('LiveStreamingGateway', () => {
  let gateway: LiveStreamingGateway;
  let service: {
    joinStream: jest.Mock;
    leaveStream: jest.Mock;
    getViewerCount: jest.Mock;
    postMessage: jest.Mock;
    selectQuality: jest.Mock;
  };
  let server: { to: jest.Mock; emit: jest.Mock };
  let client: {
    id: string;
    data: Record<string, unknown>;
    join: jest.Mock;
    leave: jest.Mock;
  };

  beforeEach(() => {
    service = {
      joinStream: jest.fn().mockResolvedValue({ id: 'viewer-row' }),
      leaveStream: jest.fn().mockResolvedValue(undefined),
      getViewerCount: jest.fn().mockResolvedValue(7),
      postMessage: jest.fn().mockResolvedValue({ id: 'msg-1', content: 'hi' }),
      selectQuality: jest.fn().mockResolvedValue({ quality: 'low' }),
    };

    gateway = new LiveStreamingGateway(service as never);

    server = { to: jest.fn(), emit: jest.fn() };
    server.to.mockReturnValue(server);
    gateway.server = server as never;

    client = {
      id: 'socket-1',
      data: {},
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('joins the room, records the membership, and broadcasts the count', async () => {
    const result = await gateway.handleJoin(client as never, {
      streamId: 'stream-1',
      userId: 'viewer-1',
      username: 'ada',
      bandwidthKbps: 3_000,
    });

    expect(service.joinStream).toHaveBeenCalledWith('stream-1', 'viewer-1', {
      username: 'ada',
      bandwidthKbps: 3_000,
    });
    expect(client.join).toHaveBeenCalledWith('stream:stream-1');
    expect(client.data.userId).toBe('viewer-1');
    expect(server.to).toHaveBeenCalledWith('stream:stream-1');
    expect(server.emit).toHaveBeenCalledWith('stream:viewers', {
      streamId: 'stream-1',
      count: 7,
    });
    expect(result).toEqual({ joined: true, count: 7 });
  });

  it('broadcasts a chat message to the stream room', async () => {
    const message = await gateway.handleChat({
      streamId: 'stream-1',
      userId: 'viewer-1',
      content: 'hi',
    });

    expect(service.postMessage).toHaveBeenCalledWith(
      'stream-1',
      'viewer-1',
      'hi',
    );
    expect(server.to).toHaveBeenCalledWith('stream:stream-1');
    expect(server.emit).toHaveBeenCalledWith('stream:chat', message);
  });

  it('leaves the room on leave', async () => {
    await gateway.handleLeave(client as never, {
      streamId: 'stream-1',
      userId: 'viewer-1',
    });

    expect(service.leaveStream).toHaveBeenCalledWith('stream-1', 'viewer-1');
    expect(client.leave).toHaveBeenCalledWith('stream:stream-1');
  });

  it('marks the viewer left when a socket disconnects', async () => {
    client.data = { userId: 'viewer-1', streamId: 'stream-1' };
    await gateway.handleDisconnect(client as never);
    expect(service.leaveStream).toHaveBeenCalledWith('stream-1', 'viewer-1');
  });

  it('adapts quality mid-stream', async () => {
    await gateway.handleQuality({
      streamId: 'stream-1',
      userId: 'viewer-1',
      bandwidthKbps: 800,
    });
    expect(service.selectQuality).toHaveBeenCalledWith(
      'stream-1',
      'viewer-1',
      800,
    );
  });
});
