import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

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
import { CreateStreamDto } from './dto/create-stream.dto';
import { JoinStreamDto } from './dto/join-stream.dto';
import { ModerateStreamDto } from './dto/moderate-stream.dto';

export interface StreamAnalytics {
  streamId: string;
  status: LiveStreamStatus;
  currentViewers: number;
  peakViewers: number;
  totalJoins: number;
  chatMessages: number;
  moderationActions: number;
  qualityDistribution: Record<StreamQuality, number>;
  recording: { enabled: boolean; url: string | null };
  durationSeconds: number;
}

/**
 * Deterministic bandwidth -> quality mapping.
 *
 * Deliberately a pure function so the ladder is testable without a viewer row
 * and the same input always picks the same rung. Unknown bandwidth falls back to
 * `MEDIUM`, the quality a viewer joins with before the first measurement.
 */
export function qualityForBandwidth(bandwidthKbps?: number): StreamQuality {
  if (bandwidthKbps === undefined || bandwidthKbps === null) {
    return StreamQuality.MEDIUM;
  }
  if (bandwidthKbps >= 6_000) return StreamQuality.SOURCE;
  if (bandwidthKbps >= 2_500) return StreamQuality.HIGH;
  if (bandwidthKbps >= 1_000) return StreamQuality.MEDIUM;
  return StreamQuality.LOW;
}

@Injectable()
export class LiveStreamingService {
  private readonly logger = new Logger(LiveStreamingService.name);

  constructor(
    @InjectRepository(LiveStream)
    private readonly streamRepo: Repository<LiveStream>,
    @InjectRepository(StreamViewer)
    private readonly viewerRepo: Repository<StreamViewer>,
    @InjectRepository(StreamChatMessage)
    private readonly chatRepo: Repository<StreamChatMessage>,
    @InjectRepository(StreamModerationAction)
    private readonly moderationRepo: Repository<StreamModerationAction>,
  ) {}

  // ─── Stream lifecycle ──────────────────────────────────────────────────────

  async createStream(
    hostId: string,
    dto: CreateStreamDto,
  ): Promise<LiveStream> {
    const stream = this.streamRepo.create({
      hostId,
      title: dto.title,
      description: dto.description,
      recordingEnabled: dto.recordingEnabled ?? false,
      status: LiveStreamStatus.SCHEDULED,
      currentQuality: StreamQuality.MEDIUM,
      viewerCount: 0,
      peakViewerCount: 0,
    });
    return this.streamRepo.save(stream);
  }

  async startStream(streamId: string, hostId: string): Promise<LiveStream> {
    const stream = await this.requireStream(streamId);
    this.requireHost(stream, hostId);

    if (stream.status === LiveStreamStatus.LIVE) {
      return stream;
    }
    if (
      stream.status === LiveStreamStatus.ENDED ||
      stream.status === LiveStreamStatus.CANCELLED
    ) {
      throw new BadRequestException('Stream has already finished');
    }

    stream.status = LiveStreamStatus.LIVE;
    stream.startedAt = stream.startedAt ?? new Date();
    return this.streamRepo.save(stream);
  }

  async endStream(streamId: string, hostId: string): Promise<LiveStream> {
    const stream = await this.requireStream(streamId);
    this.requireHost(stream, hostId);

    if (stream.status === LiveStreamStatus.ENDED) {
      return stream;
    }
    if (stream.status === LiveStreamStatus.CANCELLED) {
      throw new BadRequestException('Stream was cancelled');
    }

    stream.status = LiveStreamStatus.ENDED;
    stream.endedAt = new Date();
    if (stream.recordingEnabled && !stream.recordingUrl) {
      stream.recordingUrl = this.recordingUrl(stream.id);
    }
    return this.streamRepo.save(stream);
  }

  async cancelStream(streamId: string, hostId: string): Promise<LiveStream> {
    const stream = await this.requireStream(streamId);
    this.requireHost(stream, hostId);

    if (
      stream.status === LiveStreamStatus.ENDED ||
      stream.status === LiveStreamStatus.CANCELLED
    ) {
      throw new BadRequestException('Stream has already finished');
    }

    stream.status = LiveStreamStatus.CANCELLED;
    stream.endedAt = new Date();
    return this.streamRepo.save(stream);
  }

  async listStreams(status?: LiveStreamStatus): Promise<LiveStream[]> {
    return this.streamRepo.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async getStream(streamId: string): Promise<LiveStream> {
    return this.requireStream(streamId);
  }

  // ─── Spectators ────────────────────────────────────────────────────────────

  async joinStream(
    streamId: string,
    viewerId: string,
    dto: JoinStreamDto = {},
  ): Promise<StreamViewer> {
    const stream = await this.requireStream(streamId);
    if (
      stream.status !== LiveStreamStatus.LIVE &&
      stream.status !== LiveStreamStatus.SCHEDULED
    ) {
      throw new BadRequestException('Stream is not joinable');
    }
    await this.requireNotBlocked(streamId, viewerId);

    const existing = await this.findActiveViewer(streamId, viewerId);
    if (existing) {
      return existing;
    }

    const quality =
      dto.bandwidthKbps !== undefined
        ? qualityForBandwidth(dto.bandwidthKbps)
        : dto.preferredQuality ?? StreamQuality.MEDIUM;

    const viewer = this.viewerRepo.create({
      streamId,
      viewerId,
      username: dto.username,
      quality,
      isActive: true,
      isModerator: false,
      joinedAt: new Date(),
    });
    const saved = await this.viewerRepo.save(viewer);

    stream.viewerCount = (stream.viewerCount ?? 0) + 1;
    stream.peakViewerCount = Math.max(
      stream.peakViewerCount ?? 0,
      stream.viewerCount,
    );
    await this.streamRepo.save(stream);

    this.logger.log(`Viewer ${viewerId} joined stream ${streamId}`);
    return saved;
  }

  async leaveStream(streamId: string, viewerId: string): Promise<void> {
    await this.requireStream(streamId);
    const viewer = await this.findActiveViewer(streamId, viewerId);
    if (!viewer) {
      throw new NotFoundException('Not currently watching this stream');
    }

    viewer.isActive = false;
    viewer.leftAt = new Date();
    await this.viewerRepo.save(viewer);

    const stream = await this.requireStream(streamId);
    stream.viewerCount = Math.max(0, (stream.viewerCount ?? 1) - 1);
    await this.streamRepo.save(stream);
  }

  async getViewerCount(streamId: string): Promise<number> {
    return this.viewerRepo.count({ where: { streamId, isActive: true } });
  }

  async selectQuality(
    streamId: string,
    viewerId: string,
    bandwidthKbps: number,
  ): Promise<StreamViewer> {
    await this.requireStream(streamId);
    const viewer = await this.findActiveViewer(streamId, viewerId);
    if (!viewer) {
      throw new NotFoundException('Not currently watching this stream');
    }

    viewer.quality = qualityForBandwidth(bandwidthKbps);
    return this.viewerRepo.save(viewer);
  }

  // ─── Chat ──────────────────────────────────────────────────────────────────

  async postMessage(
    streamId: string,
    authorId: string,
    content: string,
  ): Promise<StreamChatMessage> {
    const stream = await this.requireStream(streamId);
    if (stream.status !== LiveStreamStatus.LIVE) {
      throw new BadRequestException('Chat is only open on a live stream');
    }
    await this.requireNotBlocked(streamId, authorId);

    const body = content?.trim();
    if (!body) {
      throw new BadRequestException('Message cannot be empty');
    }
    if (body.length > 500) {
      throw new BadRequestException('Message exceeds 500 characters');
    }

    const message = this.chatRepo.create({
      streamId,
      authorId,
      content: body,
      isDeleted: false,
      isPinned: false,
    });
    return this.chatRepo.save(message);
  }

  async getChatHistory(
    streamId: string,
    limit = 50,
  ): Promise<StreamChatMessage[]> {
    await this.requireStream(streamId);
    return this.chatRepo.find({
      where: { streamId, isDeleted: false },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  // ─── Moderation ────────────────────────────────────────────────────────────

  async moderate(
    streamId: string,
    moderatorId: string,
    dto: ModerateStreamDto,
  ): Promise<StreamModerationAction> {
    const stream = await this.requireStream(streamId);
    await this.requireModerator(stream, moderatorId);

    switch (dto.action) {
      case ModerationActionType.BAN:
      case ModerationActionType.UNBAN:
      case ModerationActionType.TIMEOUT:
        if (!dto.targetUserId) {
          throw new BadRequestException(
            'targetUserId is required for this action',
          );
        }
        break;
      case ModerationActionType.DELETE_MESSAGE:
      case ModerationActionType.PIN_MESSAGE:
        if (!dto.messageId) {
          throw new BadRequestException(
            'messageId is required for this action',
          );
        }
        break;
      default:
        break;
    }

    const expiresAt =
      dto.action === ModerationActionType.TIMEOUT
        ? new Date(Date.now() + (dto.durationMinutes ?? 10) * 60_000)
        : undefined;

    const action = this.moderationRepo.create({
      streamId,
      moderatorId,
      targetUserId: dto.targetUserId,
      action: dto.action,
      reason: dto.reason,
      messageId: dto.messageId,
      expiresAt,
    });
    const saved = await this.moderationRepo.save(action);

    if (dto.action === ModerationActionType.BAN && dto.targetUserId) {
      await this.deactivateViewer(streamId, dto.targetUserId);
    }
    if (dto.action === ModerationActionType.DELETE_MESSAGE && dto.messageId) {
      await this.chatRepo.update(
        { id: dto.messageId, streamId },
        { isDeleted: true, deletedBy: moderatorId },
      );
    }
    if (dto.action === ModerationActionType.CLEAR_CHAT) {
      await this.chatRepo.update({ streamId }, { isDeleted: true });
    }
    if (dto.action === ModerationActionType.PIN_MESSAGE && dto.messageId) {
      await this.chatRepo.update(
        { id: dto.messageId, streamId },
        { isPinned: true },
      );
    }

    return saved;
  }

  async getModerationLog(streamId: string): Promise<StreamModerationAction[]> {
    await this.requireStream(streamId);
    return this.moderationRepo.find({
      where: { streamId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Recording ─────────────────────────────────────────────────────────────

  async startRecording(streamId: string, hostId: string): Promise<LiveStream> {
    const stream = await this.requireStream(streamId);
    this.requireHost(stream, hostId);
    stream.recordingEnabled = true;
    return this.streamRepo.save(stream);
  }

  async stopRecording(streamId: string, hostId: string): Promise<LiveStream> {
    const stream = await this.requireStream(streamId);
    this.requireHost(stream, hostId);
    stream.recordingEnabled = false;
    stream.recordingUrl = stream.recordingUrl ?? this.recordingUrl(stream.id);
    return this.streamRepo.save(stream);
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────

  async getAnalytics(streamId: string): Promise<StreamAnalytics> {
    const stream = await this.requireStream(streamId);
    const active = await this.viewerRepo.find({
      where: { streamId, isActive: true },
    });

    const distribution: Record<StreamQuality, number> = {
      [StreamQuality.LOW]: 0,
      [StreamQuality.MEDIUM]: 0,
      [StreamQuality.HIGH]: 0,
      [StreamQuality.SOURCE]: 0,
    };
    for (const viewer of active) {
      distribution[viewer.quality] += 1;
    }

    const [totalJoins, chatMessages, moderationActions] = await Promise.all([
      this.viewerRepo.count({ where: { streamId } }),
      this.chatRepo.count({ where: { streamId, isDeleted: false } }),
      this.moderationRepo.count({ where: { streamId } }),
    ]);

    const endedAt = stream.endedAt ?? new Date();
    const durationSeconds = stream.startedAt
      ? Math.max(
          0,
          Math.floor((endedAt.getTime() - stream.startedAt.getTime()) / 1000),
        )
      : 0;

    return {
      streamId,
      status: stream.status,
      currentViewers: active.length,
      peakViewers: stream.peakViewerCount ?? 0,
      totalJoins,
      chatMessages,
      moderationActions,
      qualityDistribution: distribution,
      recording: {
        enabled: stream.recordingEnabled,
        url: stream.recordingUrl ?? null,
      },
      durationSeconds,
    };
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private async requireStream(streamId: string): Promise<LiveStream> {
    const stream = await this.streamRepo.findOne({ where: { id: streamId } });
    if (!stream) {
      throw new NotFoundException('Stream not found');
    }
    return stream;
  }

  private requireHost(stream: LiveStream, userId: string): void {
    if (stream.hostId !== userId) {
      throw new ForbiddenException('Only the stream host can do that');
    }
  }

  private async requireModerator(
    stream: LiveStream,
    userId: string,
  ): Promise<void> {
    if (stream.hostId === userId) {
      return;
    }
    const viewer = await this.findActiveViewer(stream.id, userId);
    if (!viewer?.isModerator) {
      throw new ForbiddenException('Moderator privileges required');
    }
  }

  private async findActiveViewer(
    streamId: string,
    viewerId: string,
  ): Promise<StreamViewer | null> {
    return this.viewerRepo.findOne({
      where: { streamId, viewerId, isActive: true },
    });
  }

  private async requireNotBlocked(
    streamId: string,
    viewerId: string,
  ): Promise<void> {
    const actions = await this.moderationRepo.find({
      where: {
        streamId,
        targetUserId: viewerId,
        action: In([ModerationActionType.BAN, ModerationActionType.UNBAN]),
      },
      order: { createdAt: 'DESC' },
    });
    if (actions[0]?.action === ModerationActionType.BAN) {
      throw new ForbiddenException('You are banned from this stream');
    }

    const timeouts = await this.moderationRepo.find({
      where: {
        streamId,
        targetUserId: viewerId,
        action: ModerationActionType.TIMEOUT,
      },
      order: { createdAt: 'DESC' },
    });
    const latest = timeouts[0];
    if (latest?.expiresAt && latest.expiresAt.getTime() > Date.now()) {
      throw new ForbiddenException('You are timed out from this stream');
    }
  }

  private async deactivateViewer(
    streamId: string,
    viewerId: string,
  ): Promise<void> {
    const viewer = await this.findActiveViewer(streamId, viewerId);
    if (!viewer) {
      return;
    }
    viewer.isActive = false;
    viewer.leftAt = new Date();
    await this.viewerRepo.save(viewer);
  }

  private recordingUrl(streamId: string): string {
    return `recordings/${streamId}.m3u8`;
  }
}
