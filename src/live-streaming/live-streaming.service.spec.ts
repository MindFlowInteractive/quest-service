import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  LiveStreamingService,
  qualityForBandwidth,
} from './live-streaming.service';
import {
  LiveStream,
  LiveStreamStatus,
  StreamQuality,
} from './entities/live-stream.entity';
import { StreamViewer } from './entities/stream-viewer.entity';
import { StreamChatMessage } from './entities/stream-chat-message.entity';
import {
  ModerationActionType,
  StreamModerationAction,
} from './entities/stream-moderation-action.entity';

const mockRepo = () => ({
  create: jest.fn((d) => d),
  save: jest.fn((d) => Promise.resolve({ ...d, id: d.id ?? 'generated-id' })),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
});

const baseStream = (over: Partial<LiveStream> = {}): LiveStream => ({
  id: 'stream-1',
  hostId: 'host-1',
  title: 'Speedrun',
  description: undefined,
  status: LiveStreamStatus.SCHEDULED,
  currentQuality: StreamQuality.MEDIUM,
  viewerCount: 0,
  peakViewerCount: 0,
  recordingEnabled: false,
  recordingUrl: undefined,
  startedAt: undefined,
  endedAt: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe('qualityForBandwidth', () => {
  it('maps the bandwidth ladder deterministically', () => {
    expect(qualityForBandwidth(undefined)).toBe(StreamQuality.MEDIUM);
    expect(qualityForBandwidth(0)).toBe(StreamQuality.LOW);
    expect(qualityForBandwidth(999)).toBe(StreamQuality.LOW);
    expect(qualityForBandwidth(1_000)).toBe(StreamQuality.MEDIUM);
    expect(qualityForBandwidth(2_499)).toBe(StreamQuality.MEDIUM);
    expect(qualityForBandwidth(2_500)).toBe(StreamQuality.HIGH);
    expect(qualityForBandwidth(5_999)).toBe(StreamQuality.HIGH);
    expect(qualityForBandwidth(6_000)).toBe(StreamQuality.SOURCE);
  });
});

describe('LiveStreamingService', () => {
  let service: LiveStreamingService;
  let streamRepo: ReturnType<typeof mockRepo>;
  let viewerRepo: ReturnType<typeof mockRepo>;
  let chatRepo: ReturnType<typeof mockRepo>;
  let moderationRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    streamRepo = mockRepo();
    viewerRepo = mockRepo();
    chatRepo = mockRepo();
    moderationRepo = mockRepo();

    // Sensible defaults: no active blocks, no active viewers, zero counts.
    moderationRepo.find.mockResolvedValue([]);
    viewerRepo.find.mockResolvedValue([]);
    viewerRepo.count.mockResolvedValue(0);
    chatRepo.count.mockResolvedValue(0);
    moderationRepo.count.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveStreamingService,
        { provide: getRepositoryToken(LiveStream), useValue: streamRepo },
        { provide: getRepositoryToken(StreamViewer), useValue: viewerRepo },
        { provide: getRepositoryToken(StreamChatMessage), useValue: chatRepo },
        {
          provide: getRepositoryToken(StreamModerationAction),
          useValue: moderationRepo,
        },
      ],
    }).compile();

    service = module.get<LiveStreamingService>(LiveStreamingService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  describe('createStream', () => {
    it('creates a scheduled stream with zeroed counters', async () => {
      const result = await service.createStream('host-1', {
        title: 'Speedrun',
      });
      expect(result.status).toBe(LiveStreamStatus.SCHEDULED);
      expect(result.viewerCount).toBe(0);
      expect(result.peakViewerCount).toBe(0);
      expect(result.recordingEnabled).toBe(false);
    });

    it('honours a recording request', async () => {
      const result = await service.createStream('host-1', {
        title: 'Speedrun',
        recordingEnabled: true,
      });
      expect(result.recordingEnabled).toBe(true);
    });
  });

  describe('startStream', () => {
    it('starts a scheduled stream and stamps startedAt', async () => {
      streamRepo.findOne.mockResolvedValue(baseStream());
      const result = await service.startStream('stream-1', 'host-1');
      expect(result.status).toBe(LiveStreamStatus.LIVE);
      expect(result.startedAt).toBeInstanceOf(Date);
    });

    it('is idempotent when already live', async () => {
      const live = baseStream({ status: LiveStreamStatus.LIVE });
      streamRepo.findOne.mockResolvedValue(live);
      const result = await service.startStream('stream-1', 'host-1');
      expect(result).toBe(live);
      expect(streamRepo.save).not.toHaveBeenCalled();
    });

    it('refuses a non-host', async () => {
      streamRepo.findOne.mockResolvedValue(baseStream());
      await expect(
        service.startStream('stream-1', 'someone-else'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuses a finished stream', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.ENDED }),
      );
      await expect(
        service.startStream('stream-1', 'host-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('404s on an unknown stream', async () => {
      streamRepo.findOne.mockResolvedValue(null);
      await expect(
        service.startStream('missing', 'host-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('endStream / cancelStream', () => {
    it('finalises a recording when ending a recorded stream', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE, recordingEnabled: true }),
      );
      const result = await service.endStream('stream-1', 'host-1');
      expect(result.status).toBe(LiveStreamStatus.ENDED);
      expect(result.endedAt).toBeInstanceOf(Date);
      expect(result.recordingUrl).toBe('recordings/stream-1.m3u8');
    });

    it('does not invent a recording URL when recording was off', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      const result = await service.endStream('stream-1', 'host-1');
      expect(result.recordingUrl).toBeUndefined();
    });

    it('cancels a live stream', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      const result = await service.cancelStream('stream-1', 'host-1');
      expect(result.status).toBe(LiveStreamStatus.CANCELLED);
    });
  });

  describe('listStreams', () => {
    it('passes the status filter to the repository', async () => {
      streamRepo.find.mockResolvedValue([]);
      await service.listStreams(LiveStreamStatus.LIVE);
      expect(streamRepo.find).toHaveBeenCalledWith({
        where: { status: LiveStreamStatus.LIVE },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // ─── Spectators ────────────────────────────────────────────────────────────

  describe('joinStream', () => {
    it('adds an active viewer and bumps the counters', async () => {
      const stream = baseStream({
        status: LiveStreamStatus.LIVE,
        viewerCount: 2,
        peakViewerCount: 2,
      });
      streamRepo.findOne.mockResolvedValue(stream);
      viewerRepo.findOne.mockResolvedValue(null);

      const viewer = await service.joinStream('stream-1', 'viewer-1', {
        username: 'ada',
        bandwidthKbps: 3_000,
      });

      expect(viewer.isActive).toBe(true);
      expect(viewer.quality).toBe(StreamQuality.HIGH);
      expect(stream.viewerCount).toBe(3);
      expect(stream.peakViewerCount).toBe(3);
    });

    it('is idempotent for an existing spectator', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      const existing = { id: 'v1', viewerId: 'viewer-1', isActive: true };
      viewerRepo.findOne.mockResolvedValue(existing);

      const viewer = await service.joinStream('stream-1', 'viewer-1');
      expect(viewer).toBe(existing);
      expect(streamRepo.save).not.toHaveBeenCalled();
    });

    it('refuses a finished stream', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.ENDED }),
      );
      await expect(
        service.joinStream('stream-1', 'viewer-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses a banned spectator', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      moderationRepo.find.mockResolvedValueOnce([
        { action: ModerationActionType.BAN, createdAt: new Date() },
      ]);

      await expect(
        service.joinStream('stream-1', 'viewer-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuses a spectator under an active timeout', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      moderationRepo.find
        .mockResolvedValueOnce([]) // ban/unban history
        .mockResolvedValueOnce([
          {
            action: ModerationActionType.TIMEOUT,
            expiresAt: new Date(Date.now() + 60_000),
          },
        ]);

      await expect(
        service.joinStream('stream-1', 'viewer-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows a spectator whose timeout has expired', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      moderationRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([
        {
          action: ModerationActionType.TIMEOUT,
          expiresAt: new Date(Date.now() - 60_000),
        },
      ]);
      viewerRepo.findOne.mockResolvedValue(null);

      const viewer = await service.joinStream('stream-1', 'viewer-1');
      expect(viewer.isActive).toBe(true);
    });
  });

  describe('leaveStream', () => {
    it('marks the viewer inactive and decrements the count', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE, viewerCount: 3 }),
      );
      const viewer = {
        id: 'v1',
        viewerId: 'viewer-1',
        isActive: true,
        leftAt: undefined,
      };
      viewerRepo.findOne.mockResolvedValue(viewer);

      await service.leaveStream('stream-1', 'viewer-1');
      expect(viewer.isActive).toBe(false);
      expect(viewer.leftAt).toBeInstanceOf(Date);
    });

    it('404s when not watching', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      viewerRepo.findOne.mockResolvedValue(null);
      await expect(
        service.leaveStream('stream-1', 'viewer-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('selectQuality', () => {
    it('adapts the viewer quality to measured bandwidth', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      const viewer = { id: 'v1', quality: StreamQuality.MEDIUM };
      viewerRepo.findOne.mockResolvedValue(viewer);

      const result = await service.selectQuality('stream-1', 'viewer-1', 500);
      expect(result.quality).toBe(StreamQuality.LOW);
    });

    it('404s for a non-viewer', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      viewerRepo.findOne.mockResolvedValue(null);
      await expect(
        service.selectQuality('stream-1', 'viewer-1', 9_000),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ─── Chat ──────────────────────────────────────────────────────────────────

  describe('postMessage', () => {
    it('trims and stores a message on a live stream', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      const message = await service.postMessage(
        'stream-1',
        'viewer-1',
        '  nice  ',
      );
      expect(message.content).toBe('nice');
      expect(message.isDeleted).toBe(false);
    });

    it('rejects chat when the stream is not live', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.SCHEDULED }),
      );
      await expect(
        service.postMessage('stream-1', 'viewer-1', 'hi'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an empty message', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      await expect(
        service.postMessage('stream-1', 'viewer-1', '   '),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a banned author', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      moderationRepo.find.mockResolvedValueOnce([
        { action: ModerationActionType.BAN, createdAt: new Date() },
      ]);
      await expect(
        service.postMessage('stream-1', 'viewer-1', 'hi'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getChatHistory', () => {
    it('excludes deleted messages and applies the limit', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      chatRepo.find.mockResolvedValue([]);
      await service.getChatHistory('stream-1', 25);
      expect(chatRepo.find).toHaveBeenCalledWith({
        where: { streamId: 'stream-1', isDeleted: false },
        order: { createdAt: 'ASC' },
        take: 25,
      });
    });
  });

  // ─── Moderation ────────────────────────────────────────────────────────────

  describe('moderate', () => {
    beforeEach(() => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
    });

    it('allows the host to ban a spectator and deactivates them', async () => {
      const viewer = { id: 'v1', isActive: true };
      viewerRepo.findOne.mockResolvedValue(viewer);

      const action = await service.moderate('stream-1', 'host-1', {
        action: ModerationActionType.BAN,
        targetUserId: 'viewer-1',
      });

      expect(action.action).toBe(ModerationActionType.BAN);
      expect(viewer.isActive).toBe(false);
    });

    it('refuses a non-moderator', async () => {
      viewerRepo.findOne.mockResolvedValue(null);
      await expect(
        service.moderate('stream-1', 'viewer-1', {
          action: ModerationActionType.CLEAR_CHAT,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows an assigned moderator', async () => {
      viewerRepo.findOne.mockResolvedValue({
        id: 'v2',
        isActive: true,
        isModerator: true,
      });
      const action = await service.moderate('stream-1', 'mod-1', {
        action: ModerationActionType.CLEAR_CHAT,
      });
      expect(action.action).toBe(ModerationActionType.CLEAR_CHAT);
      expect(chatRepo.update).toHaveBeenCalledWith(
        { streamId: 'stream-1' },
        { isDeleted: true },
      );
    });

    it('requires a target for a ban', async () => {
      await expect(
        service.moderate('stream-1', 'host-1', {
          action: ModerationActionType.BAN,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sets an expiry on a timeout', async () => {
      viewerRepo.findOne.mockResolvedValue(null);
      const before = Date.now();
      const action = await service.moderate('stream-1', 'host-1', {
        action: ModerationActionType.TIMEOUT,
        targetUserId: 'viewer-1',
        durationMinutes: 5,
      });
      expect(action.expiresAt).toBeInstanceOf(Date);
      if (!action.expiresAt) {
        throw new Error('expected a timeout expiry');
      }
      expect(action.expiresAt.getTime()).toBeGreaterThan(before);
      expect(action.expiresAt.getTime()).toBeLessThanOrEqual(
        before + 5 * 60_000 + 1_000,
      );
    });

    it('requires a message id to delete a message', async () => {
      await expect(
        service.moderate('stream-1', 'host-1', {
          action: ModerationActionType.DELETE_MESSAGE,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('soft-deletes the targeted message', async () => {
      await service.moderate('stream-1', 'host-1', {
        action: ModerationActionType.DELETE_MESSAGE,
        targetUserId: 'viewer-1',
        messageId: 'msg-1',
      });
      expect(chatRepo.update).toHaveBeenCalledWith(
        { id: 'msg-1', streamId: 'stream-1' },
        { isDeleted: true, deletedBy: 'host-1' },
      );
    });
  });

  // ─── Recording ─────────────────────────────────────────────────────────────

  describe('recording', () => {
    it('toggles recording for the host', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      const started = await service.startRecording('stream-1', 'host-1');
      expect(started.recordingEnabled).toBe(true);

      const stopped = await service.stopRecording('stream-1', 'host-1');
      expect(stopped.recordingEnabled).toBe(false);
      expect(stopped.recordingUrl).toBe('recordings/stream-1.m3u8');
    });

    it('refuses recording control by a non-host', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({ status: LiveStreamStatus.LIVE }),
      );
      await expect(
        service.startRecording('stream-1', 'viewer-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  // ─── Analytics ─────────────────────────────────────────────────────────────

  describe('getAnalytics', () => {
    it('aggregates viewership, chat and quality distribution', async () => {
      streamRepo.findOne.mockResolvedValue(
        baseStream({
          status: LiveStreamStatus.LIVE,
          peakViewerCount: 12,
          startedAt: new Date(Date.now() - 60_000),
          recordingEnabled: true,
          recordingUrl: 'recordings/stream-1.m3u8',
        }),
      );
      viewerRepo.find.mockResolvedValue([
        { quality: StreamQuality.HIGH },
        { quality: StreamQuality.HIGH },
        { quality: StreamQuality.LOW },
      ]);
      viewerRepo.count.mockResolvedValue(30);
      chatRepo.count.mockResolvedValue(44);
      moderationRepo.count.mockResolvedValue(2);

      const analytics = await service.getAnalytics('stream-1');

      expect(analytics.currentViewers).toBe(3);
      expect(analytics.peakViewers).toBe(12);
      expect(analytics.totalJoins).toBe(30);
      expect(analytics.chatMessages).toBe(44);
      expect(analytics.moderationActions).toBe(2);
      expect(analytics.qualityDistribution).toEqual({
        [StreamQuality.LOW]: 1,
        [StreamQuality.MEDIUM]: 0,
        [StreamQuality.HIGH]: 2,
        [StreamQuality.SOURCE]: 0,
      });
      expect(analytics.recording).toEqual({
        enabled: true,
        url: 'recordings/stream-1.m3u8',
      });
      expect(analytics.durationSeconds).toBeGreaterThanOrEqual(59);
    });
  });
});
